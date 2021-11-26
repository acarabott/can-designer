import * as d3 from "d3";
import { Datum, Model, RootSVG } from "./api";
import { getRadius, isDisabled } from "./datumGetters";

const getEvent = () => <d3.D3DragEvent<SVGGElement, Datum, SVGGElement>>(d3 as any).event;

export const defDatumSVGs = (
    rootSVG: RootSVG,
    model: Readonly<Model>,
    data: Datum[],
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
                .drag<SVGGElement, Datum, SVGGElement>()
                .on("start", (d: Datum) => {
                    if (!getEvent().active) {
                        model.simulation.alphaTarget(0.3).restart();
                    }
                    d.fx = d.x;
                    d.fy = d.y;
                })
                .on("drag", (d: Datum) => {
                    const event = getEvent();
                    d.fx = event.x;
                    d.fy = event.y;
                })
                .on("end", (d: Datum) => {
                    if (!getEvent().active) {
                        model.simulation.alphaTarget(0);
                    }
                    d.fx = null;
                    d.fy = null;
                }),
        );

    nodeSVGs.append("circle").attr("r", (d: Datum) => getRadius(d));
    nodeSVGs
        .append("text")
        .attr("dx", 12)
        .attr("dy", 20)
        .text((d: Datum) => d.id.replace(/_/g, " "));

    nodeSVGs.on("click", (datum: Datum) => {
        if (isDisabled(model.graph, datum)) {
            return;
        }

        datum.userEnabled = !datum.userEnabled;

        update();
    });

    return nodeSVGs;
};
