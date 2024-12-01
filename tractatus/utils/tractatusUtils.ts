import * as d3 from "d3"

export interface TractatusNode {
  key: string
  sub_key: string
  content?: {
    de: string
    en: string
  }
  children: TractatusNode[]
  empty: boolean
}

export interface D3Node extends d3.HierarchyNode<TractatusNode> {
  x: number
  y: number
  x0?: number
  y0?: number
  _children?: D3Node[]
}

export const fetchTractatus = async (): Promise<TractatusNode> => {
  const response = await fetch('https://raw.githubusercontent.com/pbellon/tractatus-tree/refs/heads/master/app/data/tractatus.json')
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
  return await response.json()
}

export const simulateArrowDownPress = () => {
  const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
  document.dispatchEvent(event);
};

export const toggleNode = (node: D3Node) => {
  if (node.children) {
    node._children = node.children;
    node.children = null;
  } else if (node._children) {
    node.children = node._children;
    node._children = null;
  }
};

export const getRootNode = (node: D3Node): D3Node => {
  let current = node;
  while (current.parent) {
    current = current.parent;
  }
  return current;
};

