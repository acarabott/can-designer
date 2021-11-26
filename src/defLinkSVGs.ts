import { Link, RootSVG } from "./api";

export const defLinkSVGs = (rootSVG: RootSVG, links: Link[]) => {
    return rootSVG
        .append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .enter()
        .append("line");
};
