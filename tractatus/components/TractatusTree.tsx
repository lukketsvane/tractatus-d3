/* eslint-disable */
// @ts-nocheck
'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import * as d3 from "d3"
import { TractatusNode, fetchTractatus, toggleNode, getRootNode } from '../utils/tractatusUtils'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { VolumeIcon, VolumeX, Play, Pause, LayoutTemplateIcon as LayoutTree, CircleIcon, CircleIcon as CircleStackIcon } from 'lucide-react'
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import DOMPurify from 'dompurify'
import { audioMap } from '../data/audioMap'
import { createCirclePackingLayout } from '../utils/circleUtils'
import ContentWindow from './ContentWindow';

type D3Node = d3.HierarchyPointNode<TractatusNode> & {
  _children?: D3Node[];
  x: number;
  y: number;
  x0?: number;
  y0?: number;
};

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
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

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
        (node) => {
          selectedNodeRef.current = node;
          setSelectedContent(node.data.content?.[language] || 'select a node or use arrow keys to start');
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
        g.attr("transform", `translate(${width * 0.1}, ${height * 0.5}) scale(0.75)`);
      } else {
        g.attr("transform", `translate(${width / 2}, ${height / 2}) scale(0.75)`);
      }
    }

    const tree = layoutType === 'tree'
      ? d3.tree<TractatusNode>().size([height, width - 200]).nodeSize([60, 120])
      : d3.tree<TractatusNode>().size([2 * Math.PI, Math.min(width, height) / 2 - 100]);

    if (focusNode) {
      let currentNode: D3Node | null = focusNode;
      while (currentNode) {
        if (currentNode._children) {
          currentNode.children = currentNode._children;
          currentNode._children = undefined;
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
          setSelectedContent(d.data.content?.[language] || 'select a node or use arrow keys to start');
        })

      nodeEnter.append("circle")
        .attr("r", (d: D3Node) => d === selectedNodeRef.current ? 10 : 8)
        .style("fill", (d: D3Node) => {
          if (d === selectedNodeRef.current) return "#000";
          if (d.data.key === "1") return "#fff";
          return d._children ? "#555" : (d.children ? "#777" : "#999");
        })
        .style("stroke", (d: D3Node) => d === selectedNodeRef.current ? "#ffffff" : "none")
        .style("stroke-width", 2);

      nodeEnter.append("text")
        .attr("dy", "-1.2em")
        .attr("text-anchor", "middle")
        .text((d: D3Node) => d.data.key)
        .style("fill", "white")
        .style("font-size", "12px");

      // Add content text for leaf nodes
      nodeEnter.filter(d => !d.children && !d._children) // UPDATED LINE
        .append("text")
        .attr("dy", "0.31em")
        .attr("x", 20)
        .attr("text-anchor", "start")
        .text((d: D3Node) => {
          const content = d.data.content?.[language] || '';
          const strippedContent = content.replace(/<[^>]*>/g, '');
          return strippedContent.length > 75 ? strippedContent.substring(0, 72) + '...' : strippedContent;
        })
        .style("fill", "white")
        .style("font-size", "12px")
        .style("opacity", 0.7);

      const nodeUpdate = node.merge(nodeEnter as any)

      nodeUpdate
        .attr("transform", d => layoutType === 'tree'
          ? `translate(${d.y},${d.x})`
          : `translate(${d.y * Math.cos(d.x - Math.PI / 2)},${d.y * Math.sin(d.x - Math.PI / 2)})`)

      nodeUpdate.select("circle")
        .attr("r", (d: D3Node) => d === selectedNodeRef.current ? 10 : 8)
        .style("fill", (d: D3Node) => {
          if (d === selectedNodeRef.current) return "#000";
          if (d.data.key === "1") return "#fff";
          return d._children ? "#555" : (d.children ? "#777" : "#999");
        })
        .style("stroke", (d: D3Node) => d === selectedNodeRef.current ? "#ffffff" : "none")
        .style("stroke-width", 2);

      const nodeExit = node.exit().remove()

      const link = g.selectAll("path.link")
        .data(links, (d: any) => d.target.id)

      const linkEnter = link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", d => layoutType === 'tree' ? diagonal(d.source, d.target) : radialDiagonal(d.source, d.target))
        .style("stroke", "white")
        .style("stroke-width", "2px");

      link.merge(linkEnter as any)
        .attr("d", d => layoutType === 'tree' ? diagonal(d.source, d.target) : radialDiagonal(d.source, d.target))
        .style("opacity", (d: any) => {
          const isSelected = d.target === selectedNodeRef.current || d.source === selectedNodeRef.current;
          return isSelected ? 1 : 0.3;
        });

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
        zoom.transform(svg, d3.zoomIdentity.translate(width * 0.1, height * 0.5).scale(0.75));
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
      audioRef.current.muted = isMuted;
      audioRef.current.play();
      setIsPlaying(true);
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setTimeout(() => {
          const nextNode = findNextNodeInSequence(node);
          if (nextNode && autoplay) {
            selectedNodeRef.current = nextNode;
            setSelectedContent(nextNode.data.content?.[language] || 'select a node or use arrow keys to start');
            updateTree(getRootNode(nextNode), nextNode);
            playAudioAndMoveToNext(nextNode);
          }
        }, 750); // 0.5 second delay
      };
    } else {
      setIsPlaying(false);
      setTimeout(() => {
        const nextNode = findNextNodeInSequence(node);
        if (nextNode && autoplay) {
          selectedNodeRef.current = nextNode;
          setSelectedContent(nextNode.data.content?.[language] || 'select a node or use arrow keys to start');
          updateTree(getRootNode(nextNode), nextNode);
          playAudioAndMoveToNext(nextNode);
        }
      }, 500); // 0.5 second delay
    }
  }, [autoplay, findNextNodeInSequence, language, updateTree, isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  }, [isMuted]);

  const playSelectedNodeAudio = useCallback(() => {
    if (selectedNodeRef.current) {
      playAudioAndMoveToNext(selectedNodeRef.current);
    }
  }, [playAudioAndMoveToNext]);

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
      setSelectedContent(nextNode.data.content?.[language] || 'select a node or use arrow keys to start');
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

  useEffect(() => {
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
    <Card className="w-[100vw] h-screen bg-black text-white overflow-hidden rounded-none border-none flex flex-col" tabIndex={0}>
      <CardHeader className="fixed top-0 left-0 right-0 z-50 flex-row items-center justify-between space-y-0 py-4 bg-black/80 backdrop-blur-sm border-b border-white/10">
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
            onClick={toggleMute}
            className="focus:outline-none"
          >
            {isMuted ? <VolumeX className="h-4 w-4 text-white" /> : <VolumeIcon className="h-4 w-4 text-white" />}
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
      <CardContent className="flex-1 p-0 overflow-hidden">
        <div ref={containerRef} className="w-full h-full bg-transparent">
          <svg ref={svgRef} className="w-full h-full" />
        </div>
        <ContentWindow
          className="fixed bottom-0 left-0 w-full sm:w-80 sm:left-4 sm:bottom-4"
          selectedNode={selectedNodeRef.current}
          language={language}
          isPlaying={isPlaying}
          playSelectedNodeAudio={playSelectedNodeAudio}
          setLanguage={setLanguage}
          selectedContent={selectedContent}
        />
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

