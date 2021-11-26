import * as d3drag from "d3-drag";
import { D3DragEvent, drag } from "d3-drag";
import { Model, Node, RootSVG } from "./api";
import { getRadius, isDisabled } from "./nodeGetters";


const getEvent = () => <D3DragEvent<SVGGElement, Node, SVGGElement>>(d3drag as any).event;

export const defNodeSVGs = (
    rootSVG: RootSVG,
    model: Readonly<Model>,
    data: Node[],
    update: () => void,
) => {
    const dragHandler = drag<SVGGElement, Node, Node>()
        .on("start", (node) => {
            if (!getEvent().active) {
                model.simulation.alphaTarget(0.3).restart();
            }
            node.fx = node.x;
            node.fy = node.y;
        })
        .on("drag", (node: Node) => {
            const event = getEvent();
            node.fx = event.x;
            node.fy = event.y;
        })
        .on("end", (node: Node) => {
            if (!getEvent().active) {
                model.simulation.alphaTarget(0);
            }
            node.fx = null;
            node.fy = null;
        });

    const nodeSVGs = rootSVG
        .append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(data)
        .enter()
        .append("g")
        .call(dragHandler);

    nodeSVGs.append("circle").attr("r", (node: Node) => getRadius(node));
    nodeSVGs
        .append("text")
        .attr("dx", 12)
        .attr("dy", 20)
        .text((node: Node) => node.id.replace(/_/g, " "));

    nodeSVGs.on("click", (node: Node) => {
        if (isDisabled(model.graph, node)) {
            return;
        }

        node.userEnabled = !node.userEnabled;

        update();
    });

    return nodeSVGs;
};
