import { forceCollide, forceLink, forceManyBody, forceSimulation } from "d3-force";
import { BaseType, select } from "d3-selection";
import { Context, isNode, Link, Model, Node, NodeSVGs, RootSVG } from "./api";
import { createLinks } from "./createLinks";
import { defLinkSVGs } from "./defLinkSVGs";
import { defNodeSVGs } from "./defNodeSVGs";
import { getAllNodes } from "./getAllNodes";
import { getById } from "./getById";
import { getContentShape } from "./getContentShape";
import { defGraph } from "./model";
import { getRadius, isDisabled, isEnabled, isVisible } from "./nodeGetters";
import { updateSize } from "./updateSize";

const update = (ctx: Context) => {
    // update nodes
    ctx.model.simulation.nodes(
        getAllNodes(ctx.model.graph).filter((node: Node) => isVisible(ctx.model.graph, node)),
    );

    // update svgs
    for (const nodeSVGs of [ctx.views.types, ctx.views.properties]) {
        const getAlpha = (node: Node) =>
            isEnabled(ctx.model.graph, node) ? 1.0 : isDisabled(ctx.model.graph, node) ? 0.1 : 0.5;

        nodeSVGs.attr("display", (node: Node) => (isVisible(ctx.model.graph, node) ? "" : "none"));
        nodeSVGs.selectAll<BaseType, Node>("circle").attr(
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
            .selectAll<BaseType, Node>("text")
            .attr("fill", (node: Node) => `rgba(0, 0, 0, ${getAlpha(node)})`);
    }

    // update links
    const links = createLinks(ctx.model.graph);
    ctx.model.graph.links = links;
    ctx.views.links = defLinkSVGs(ctx.views.root, ctx.model.graph.links);
    ctx.model.simulation.force("link", forceLink(links));
    ctx.views.links.attr("display", (link: Link) =>
        isNode(link.source) ? (isEnabled(ctx.model.graph, link.source) ? "" : "none") : "",
    );
    ctx.views.links.attr("stroke-width", 2);

    // update lists
    const choices = getById("choices");
    const requirements = getById("requirements");
    const suggestions = getById("suggestions");

    for (const ul of [choices, requirements, suggestions]) {
        for (const child of Array.from(ul.children)) {
            child.remove();
        }
    }

    const defLi = (node: Node) => {
        const li = document.createElement("li");
        li.textContent = node.id.replace(/_/g, " ");
        return li;
    };

    for (const node of getAllNodes(ctx.model.graph)) {
        if (node.userEnabled || (isEnabled(ctx.model.graph, node) && node.type !== "requirement")) {
            choices.appendChild(defLi(node));
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
        simulation: forceSimulation<Node, Link>()
            .force(
                "collide",
                forceCollide<Node>().radius((d: Node) => getRadius(d)),
            )
            .force("charge", forceManyBody().strength(-10))
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

    const rootSVG: RootSVG = select("#content").append("svg");

    const reset = () => {
        ctx.views.links.remove();
        update(ctx);
    };

    const views: Context["views"] = {
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
