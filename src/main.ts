import * as d3 from "d3";
import { Context, DatumSVGs, isNode, Link, Datum, RootSVG, Model } from "./api";
import { createLinks } from "./createLinks";
import { getRadius, isDisabled, isEnabled, isVisible } from "./datumGetters";
import { defDatumSVGs } from "./defDatumSVGs";
import { defLinkSVGs } from "./defLinkSVGs";
import { getById } from "./getById";
import { getContentShape } from "./getContentShape";
import { defGraph } from "./model";
import { updateSize } from "./updateSize";

const update = (ctx: Context) => {
    // update nodes
    ctx.model.simulation.nodes(
        [...ctx.model.graph.types, ...ctx.model.graph.properties].filter((datum: Datum) =>
            isVisible(ctx.model.graph, datum),
        ),
    );

    // update svgs
    for (const datumSVGs of [ctx.views.types, ctx.views.properties]) {
        const getAlpha = (datum: Datum) =>
            isEnabled(ctx.model.graph, datum)
                ? 1.0
                : isDisabled(ctx.model.graph, datum)
                ? 0.1
                : 0.5;

        datumSVGs.attr("display", (datum: Datum) =>
            isVisible(ctx.model.graph, datum) ? "" : "none",
        );
        datumSVGs.selectAll<d3.BaseType, Datum>("circle").attr(
            "fill",
            (datum: Datum) =>
                ({
                    "1": `rgba(43, 156, 212, ${getAlpha(datum)})`,
                    "2": `rgba(43, 212, 156, ${getAlpha(datum)})`,
                    property: `rgba(249, 182, 118, ${getAlpha(datum)})`,
                    requirement: `rgba(212, 100, 100, ${getAlpha(datum)})`,
                }[datum.type]),
        );

        datumSVGs
            .selectAll<d3.BaseType, Datum>("text")
            .attr("fill", (n: Datum) => `rgba(0, 0, 0, ${getAlpha(n)})`);
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

    const defLi = (datum: Datum) => {
        const li = document.createElement("li");
        li.textContent = datum.id.replace(/_/g, " ");
        return li;
    };

    for (const datum of ctx.model.graph.types) {
        if (
            datum.userEnabled ||
            (isEnabled(ctx.model.graph, datum) && datum.type !== "requirement")
        ) {
            list.appendChild(defLi(datum));
        }
    }

    for (const datum of ctx.model.graph.properties) {
        if (
            isVisible(ctx.model.graph, datum) ||
            (isEnabled(ctx.model.graph, datum) && !datum.userEnabled)
        ) {
            const list = datum.type === "requirement" ? requirements : suggestions;
            list.appendChild(defLi(datum));
        }
    }
};

const main = () => {
    const shape = getContentShape();

    const model: Model = {
        graph: defGraph(shape),
        simulation: d3
            .forceSimulation<Datum, Link>()
            .force(
                "collide",
                d3.forceCollide<Datum>().radius((d: Datum) => getRadius(d)),
            )
            .force("charge", d3.forceManyBody().strength(-10))
            .on("tick", () => {
                const transform = (selection: DatumSVGs) =>
                    selection.attr("transform", (d: Datum) => `translate(${d.x}, ${d.y})`);
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
        types: defDatumSVGs(rootSVG, model, model.graph.types, reset),
        properties: defDatumSVGs(rootSVG, model, model.graph.properties, reset),
        links: defLinkSVGs(rootSVG, model.graph.links),
    };

    const ctx: Context = { model, views };

    window.addEventListener("resize", () => updateSize(ctx, getContentShape()), { passive: true });

    updateSize(ctx, shape);
    update(ctx);
};

main();
