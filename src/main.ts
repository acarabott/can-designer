import * as d3 from "d3";
import { Context, NodeSVGs, isNode, Link, Node, RootSVG, Model } from "./api";
import { createLinks } from "./createLinks";
import { getRadius, isDisabled, isEnabled, isVisible } from "./nodeGetters";
import { defNodeSVGs } from "./defNodeSVGs";
import { defLinkSVGs } from "./defLinkSVGs";
import { getById } from "./getById";
import { getContentShape } from "./getContentShape";
import { defGraph } from "./model";
import { updateSize } from "./updateSize";

const update = (ctx: Context) => {
    // update nodes
    ctx.model.simulation.nodes(
        [...ctx.model.graph.types, ...ctx.model.graph.properties].filter((node: Node) =>
            isVisible(ctx.model.graph, node),
        ),
    );

    // update svgs
    for (const nodeSVGs of [ctx.views.types, ctx.views.properties]) {
        const getAlpha = (node: Node) =>
            isEnabled(ctx.model.graph, node) ? 1.0 : isDisabled(ctx.model.graph, node) ? 0.1 : 0.5;

        nodeSVGs.attr("display", (node: Node) => (isVisible(ctx.model.graph, node) ? "" : "none"));
        nodeSVGs.selectAll<d3.BaseType, Node>("circle").attr(
            "fill",
            (node: Node) =>
                ({
                    "1": `rgba(43, 156, 212, ${getAlpha(node)})`,
                    "2": `rgba(43, 212, 156, ${getAlpha(node)})`,
                    property: `rgba(249, 182, 118, ${getAlpha(node)})`,
                    requirement: `rgba(212, 100, 100, ${getAlpha(node)})`,
                }[node.type]),
        );

        nodeSVGs
            .selectAll<d3.BaseType, Node>("text")
            .attr("fill", (node: Node) => `rgba(0, 0, 0, ${getAlpha(node)})`);
    }

    // update links
    const links = createLinks(ctx.model.graph);
    ctx.model.graph.links = links;
    ctx.views.links = defLinkSVGs(ctx.views.root, ctx.model.graph.links);
    ctx.model.simulation.force("link", d3.forceLink(links));
    ctx.views.links.attr("display", (link) =>
        isNode(link.source) ? (isEnabled(ctx.model.graph, link.source) ? "" : "none") : "",
    );
    ctx.views.links.attr("stroke-width", 2);

    // update lists
    const list = getById("list");
    const requirements = getById("requirements");
    const suggestions = getById("suggestions");

    for (const ul of [list, requirements, suggestions]) {
        for (const child of Array.from(ul.children)) {
            child.remove();
        }
    }

    const defLi = (node: Node) => {
        const li = document.createElement("li");
        li.textContent = node.id.replace(/_/g, " ");
        return li;
    };

    for (const node of ctx.model.graph.types) {
        if (node.userEnabled || (isEnabled(ctx.model.graph, node) && node.type !== "requirement")) {
            list.appendChild(defLi(node));
        }
    }

    for (const node of ctx.model.graph.properties) {
        if (
            isVisible(ctx.model.graph, node) ||
            (isEnabled(ctx.model.graph, node) && !node.userEnabled)
        ) {
            const list = node.type === "requirement" ? requirements : suggestions;
            list.appendChild(defLi(node));
        }
    }
};

const main = () => {
    const shape = getContentShape();

    const model: Model = {
        graph: defGraph(shape),
        simulation: d3
            .forceSimulation<Node, Link>()
            .force(
                "collide",
                d3.forceCollide<Node>().radius((d: Node) => getRadius(d)),
            )
            .force("charge", d3.forceManyBody().strength(-10))
            .on("tick", () => {
                const transform = (selection: NodeSVGs) =>
                    selection.attr("transform", (d: Node) => `translate(${d.x}, ${d.y})`);
                transform(ctx.views.types);

                transform(ctx.views.properties);

                ctx.views.links
                    .attr("x1", (link: Link) => (isNode(link.source) ? link.source.x ?? 0 : 0))
                    .attr("y1", (link: Link) => (isNode(link.source) ? link.source.y ?? 0 : 0))
                    .attr("x2", (link: Link) => (isNode(link.target) ? link.target.x ?? 0 : 0))
                    .attr("y2", (link: Link) => (isNode(link.target) ? link.target.y ?? 0 : 0));
            }),
    };

    const rootSVG: RootSVG = d3.select("#content").append("svg");

    const reset = () => {
        ctx.views.links.remove();
        update(ctx);
    };

    const views = {
        root: rootSVG,
        types: defNodeSVGs(rootSVG, model, model.graph.types, reset),
        properties: defNodeSVGs(rootSVG, model, model.graph.properties, reset),
        links: defLinkSVGs(rootSVG, model.graph.links),
    };

    const ctx: Context = { model, views };

    window.addEventListener("resize", () => updateSize(ctx, getContentShape()), { passive: true });

    updateSize(ctx, shape);
    update(ctx);
};

main();
