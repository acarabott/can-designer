import * as d3 from "d3";
import { Node, Model, RootSVG } from "./api";
import { getRadius, isDisabled } from "./nodeGetters";

const getEvent = () => <d3.D3DragEvent<SVGGElement, Node, SVGGElement>>(d3 as any).event;

export const defNodeSVGs = (
    rootSVG: RootSVG,
    model: Readonly<Model>,
    data: Node[],
    update: () => void,
) => {
    const nodeSVGs = rootSVG
        .append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(data)
        .enter()
        .append("g")
        .call(
            d3
                .drag<SVGGElement, Node, SVGGElement>()
                .on("start", (node: Node) => {
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
                }),
        );

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
