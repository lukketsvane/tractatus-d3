'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import * as d3 from "d3"
import { TractatusNode, D3Node, fetchTractatus, toggleNode, getRootNode } from '../utils/tractatusUtils'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { VolumeIcon as VolumeUp, Volume2, LayoutTemplateIcon as LayoutTree, CircleIcon, CircleIcon as CircleStackIcon } from 'lucide-react'
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import DOMPurify from 'dompurify'
import { audioMap } from '../data/audioMap'
import { createCirclePackingLayout } from '../utils/circlePackingLayout'

type LayoutType = 'tree' | 'radial' | 'circle';

const TractatusTree: React.FC = () => {
  const [data, setData] = useState<TractatusNode | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(true)
  const [language, setLanguage] = useState<'en' | 'de'>('en')
  const [zoom, setZoom] = useState(1)
  const selectedNodeRef = useRef<D3Node | null>(null);
  const [autoplay, setAutoplay] = useState(false)
  const [selectedContent, setSelectedContent] = useState<string>('');
  const [layoutType, setLayoutType] = useState<LayoutType>('tree');

  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    fetchTractatus()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  const updateTree = useCallback((root: D3Node, focusNode: D3Node | null = null, currentTransform: d3.ZoomTransform | null = null) => {
    if (!svgRef.current || !containerRef.current) return

    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    if (layoutType === 'circle') {
      const circlePacking = createCirclePackingLayout(
        root,
        width,
        height,
        selectedNodeRef.current,
        (node: D3Node) => {
          selectedNodeRef.current = node;
          setSelectedContent(node.data.content?.[language] || 'No content available');
          updateTree(root, node);
        },
        language
      );
      svg.node()?.appendChild(circlePacking);
      return;
    }

    const g = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")

    if (currentTransform) {
      g.attr("transform", currentTransform.toString());
    } else {
      if (layoutType === 'tree') {
        g.attr("transform", `translate(${width * 0.1}, ${height * 0.7}) scale(0.75)`);
      } else {
        g.attr("transform", `translate(${width / 2}, ${height / 2}) scale(0.75)`);
      }
    }

    const tree = layoutType === 'tree'
      ? d3.tree<TractatusNode>().size([height - 100, width - 200]).nodeSize([60, 120])
      : d3.tree<TractatusNode>().size([2 * Math.PI, Math.min(width, height) / 2 - 100]);

    if (focusNode) {
      let currentNode: D3Node | null = focusNode;
      while (currentNode) {
        if (currentNode._children) {
          currentNode.children = currentNode._children;
          currentNode._children = null;
        }
        currentNode = currentNode.parent;
      }
    }

    function update(source: D3Node) {
      const treeData = tree(root)

      const nodes = treeData.descendants()
      const links = treeData.links()

      const node = g.selectAll("g.node")
        .data(nodes, (d: any) => d.id || (d.id = ++i))

      const nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", d => layoutType === 'tree'
          ? `translate(${d.y},${d.x})`
          : `translate(${d.y * Math.cos(d.x - Math.PI / 2)},${d.y * Math.sin(d.x - Math.PI / 2)})`)
        .on("click", (event, d: any) => {
          selectedNodeRef.current = d;
          toggleNode(d);
          update(root);
          setSelectedContent(d.data.content?.[language] || 'No content available');
        })

      nodeEnter.append("circle")
        .attr("r", d => d === selectedNodeRef.current ? 10 : 8)
        .style("fill", (d: any) => {
          if (d === selectedNodeRef.current) return "#000";
          if (d.data.key === "1") return "#fff";
          return d._children ? "#555" : (d.children ? "#777" : "#999");
        })
        .style("stroke", d => d === selectedNodeRef.current ? "#ffffff" : "none")
        .style("stroke-width", 2);

      nodeEnter.append("text")
        .attr("dy", "0.31em")
        .attr("x", d => d.children || d._children ? -13 : 13)
        .attr("text-anchor", d => d.children || d._children ? "end" : "start")
        .text((d: any) => d.data.key)
        .style("fill", "white")
        .style("font-size", "12px")

      const nodeUpdate = node.merge(nodeEnter as any)

      nodeUpdate
        .attr("transform", d => layoutType === 'tree'
          ? `translate(${d.y},${d.x})`
          : `translate(${d.y * Math.cos(d.x - Math.PI / 2)},${d.y * Math.sin(d.x - Math.PI / 2)})`)

      nodeUpdate.select("circle")
        .attr("r", d => d === selectedNodeRef.current ? 10 : 8)
        .style("fill", (d: any) => {
          if (d === selectedNodeRef.current) return "#000";
          if (d.data.key === "1") return "#fff";
          return d._children ? "#555" : (d.children ? "#777" : "#999");
        })
        .style("stroke", d => d === selectedNodeRef.current ? "#ffffff" : "none")
        .style("stroke-width", 2);

      const nodeExit = node.exit().remove()

      const link = g.selectAll("path.link")
        .data(links, (d: any) => d.target.id)

      const linkEnter = link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", d => layoutType === 'tree' ? diagonal(d.source, d.target) : radialDiagonal(d.source, d.target))
        .style("stroke", "white")
        .style("stroke-width", "2px")

      link.merge(linkEnter as any)
        .attr("d", d => layoutType === 'tree' ? diagonal(d.source, d.target) : radialDiagonal(d.source, d.target))

      link.exit().remove()

      nodes.forEach((d: any) => {
        d.x0 = d.x
        d.y0 = d.y
      })
    }

    function diagonal(s: any, d: any) {
      return `M ${s.y} ${s.x}
            C ${(s.y + d.y) / 2} ${s.x},
              ${(s.y + d.y) / 2} ${d.x},
              ${d.y} ${d.x}`
    }

    function radialDiagonal(s: any, d: any) {
      const path = d3.path();
      path.moveTo(s.y * Math.cos(s.x - Math.PI / 2), s.y * Math.sin(s.x - Math.PI / 2));
      path.lineTo(d.y * Math.cos(d.x - Math.PI / 2), d.y * Math.sin(d.x - Math.PI / 2));
      return path.toString();
    }

    let i = 0
    update(root)

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .extent([[0, 0], [width, height]])
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform.toString())
        setZoom(event.transform.k)
      });

    svg.call(zoom)
      .on("touchstart", (event) => event.preventDefault())
      .on("touchmove", (event) => event.preventDefault());

    if (!currentTransform) {
      if (layoutType === 'tree') {
        zoom.transform(svg, d3.zoomIdentity.translate(width * 0.1, height * 0.7).scale(0.75));
      } else {
        zoom.transform(svg, d3.zoomIdentity.translate(width / 2, height / 2).scale(0.75));
      }
    }
  }, [layoutType, language])

  useEffect(() => {
    if (data) {
      const root = d3.hierarchy(data) as D3Node
      root.x0 = 0
      root.y0 = 0

      root.descendants().forEach((d) => {
        if (d.children) {
          d._children = d.children
          d.children = null
        }
      })

      selectedNodeRef.current = root;
      updateTree(root, root);
    }
  }, [data, updateTree, layoutType, language])

  const toggleLanguage = useCallback(() =>
    setLanguage(prev => prev === 'en' ? 'de' : 'en'), []
  )

  const toggleLayout = useCallback(() => {
    setLayoutType(prev => {
      if (prev === 'tree') return 'radial';
      if (prev === 'radial') return 'circle';
      return 'tree';
    });
  }, []);

  const findNextNodeInSequence = useCallback((node: D3Node): D3Node | null => {
    if (node.children && node.children.length > 0) {
      return node.children[0];
    }
    
    let current: D3Node | null = node;
    while (current.parent) {
      const siblings = current.parent.children;
      const currentIndex = siblings.indexOf(current);
      if (currentIndex < siblings.length - 1) {
        return siblings[currentIndex + 1];
      }
      current = current.parent;
    }
    
    return null;
  }, []);

  const playAudioAndMoveToNext = useCallback((node: D3Node) => {
    const audioUrl = audioMap[node.data.key];
    if (audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.onended = null;
      }
      audioRef.current = new Audio(audioUrl);
      audioRef.current.play();
      audioRef.current.onended = () => {
        setTimeout(() => {
          const nextNode = findNextNodeInSequence(node);
          if (nextNode && autoplay) {
            selectedNodeRef.current = nextNode;
            setSelectedContent(nextNode.data.content?.[language] || 'No content available');
            updateTree(getRootNode(nextNode), nextNode);
            playAudioAndMoveToNext(nextNode);
          }
        }, 750); // 0.5 second delay
      };
    } else {
      setTimeout(() => {
        const nextNode = findNextNodeInSequence(node);
        if (nextNode && autoplay) {
          selectedNodeRef.current = nextNode;
          setSelectedContent(nextNode.data.content?.[language] || 'No content available');
          updateTree(getRootNode(nextNode), nextNode);
          playAudioAndMoveToNext(nextNode);
        }
      }, 500); // 0.5 second delay
    }
  }, [autoplay, findNextNodeInSequence, language, updateTree]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!selectedNodeRef.current) return;

    let nextNode: D3Node | null = null;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextNode = findNextNodeInSequence(selectedNodeRef.current);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextNode = selectedNodeRef.current.parent;
        break;
    }

    if (nextNode) {
      selectedNodeRef.current = nextNode;
      setSelectedContent(nextNode.data.content?.[language] || 'No content available');
      const svg = d3.select(svgRef.current);
      const currentTransform = d3.zoomTransform(svg.node() as Element);

      updateTree(getRootNode(nextNode), nextNode, currentTransform);
      
      if (autoplay) {
        playAudioAndMoveToNext(nextNode);
      }
    }
  }, [selectedNodeRef, findNextNodeInSequence, language, updateTree, autoplay, playAudioAndMoveToNext]);

  useEffect(() => {
    if (autoplay && selectedNodeRef.current) {
      playAudioAndMoveToNext(selectedNodeRef.current);
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.onended = null;
      }
    };
  }, [autoplay, selectedNodeRef, playAudioAndMoveToNext]);

  useEffect(() =>{
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  if (loading) {
    return (
      <Card className="w-full h-[100vh] bg-black text-white overflow-hidden rounded-none border-none flex flex-col" tabIndex={0}>
        <CardHeader className="sticky top-0 z-50 flex-row items-center justify-between space-y-0 py-4 bg-black/80 backdrop-blur-sm border-b border-white/10">
          <CardTitle className="text-xl sm:text-3xl font-bold">Tractatus</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-white rounded-full border-t-transparent animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card className="w-full h-[calc(100vh-2rem)] bg-gradient-to-br from-red-900 to-red-800 text-white rounded-lg border border-white/20">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">{error ? 'Error' : 'No Data'}</CardTitle>
        </CardHeader>
        {error && (
          <CardContent>
            <p className="text-red-300">{error.message}</p>
          </CardContent>
        )}
      </Card>
    )
  }

  return (
    <Card className="w-full h-[100vh] bg-black text-white overflow-hidden rounded-none border-none flex flex-col" tabIndex={0}>
      <CardHeader className="sticky top-0 z-50 flex-row items-center justify-between space-y-0 py-4 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <CardTitle className="text-xl sm:text-3xl font-bold">Tractatus</CardTitle>
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleLayout}
            className="focus:outline-none mr-2"
          >
            {layoutType === 'tree' ? <LayoutTree className="h-4 w-4 text-white" /> : 
             layoutType === 'radial' ? <CircleIcon className="h-4 w-4 text-white" /> :
             <CircleStackIcon className="h-4 w-4 text-white" />}
          </button>
          <button
            onClick={() => playAudioAndMoveToNext(selectedNodeRef.current!)}
            className="focus:outline-none"
            disabled={!selectedNodeRef.current}
          >
            {autoplay ? <Volume2 className="h-4 w-4 text-white" /> : <VolumeUp className="h-4 w-4 text-white" />}
          </button>
          <div className="flex items-center space-x-2">
            <Switch
              id="autoplay"
              checked={autoplay}
              onCheckedChange={setAutoplay}
              className="bg-white border-2 border-white data-[state=checked]:bg-black data-[state=checked]:border-white"
            />
            <Label htmlFor="autoplay" className="text-xs text-white"> </Label>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 relative flex-grow overflow-hidden">
        <div ref={containerRef} className="h-full w-full bg-transparent">
          <svg ref={svgRef} className="w-full h-full" />
        </div>
        {selectedNodeRef.current && (
          <div className="absolute bottom-0 left-0 w-full sm:left-4 sm:w-96 h-40 rounded-lg p-4 backdrop-blur-sm bg-black/80 border border-white/20 overflow-y-auto">
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold">{selectedNodeRef.current.data.key}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setLanguage('en')}
                    className={`${language === 'en' ? 'opacity-100' : 'opacity-50'} focus:outline-none`}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => setLanguage('de')}
                    className={`${language === 'de' ? 'opacity-100' : 'opacity-50'} focus:outline-none`}
                  >
                    DE
                  </button>
                </div>
              </div>
              <div className="flex-grow overflow-y-auto">
                <p className="text-sm">
                  <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedContent) }} />
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <style jsx global>{`
        .switch[data-state="checked"] .switch-thumb {
          transform: translateX(16px);
          background-color: white;
        }
        .switch[data-state="unchecked"] .switch-thumb {
          transform: translateX(2px);
          background-color: black;
        }
      `}</style>
    </Card>
  )
}

export default TractatusTree

