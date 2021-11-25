import * as d3 from "d3";
import { DatumSelection, Graph, isNode, Link, Node, Simulation, SVG } from "./api";
import { isEnabled, isVisible, getRadius, isDisabled } from "./datumGetters";
import { getContentSize } from "./getContentSize";
import { defGraph } from "./model";
import { updateLists } from "./updateLists";

const createState = (graph: Readonly<Graph>, simulation: Readonly<Simulation>, svg: Readonly<SVG>) => {
    const getEvent = (d3: unknown) =>
        <d3.D3DragEvent<SVGGElement, Node, SVGGElement>>(d3 as any).event;

    const dragHandler = d3
        .drag<SVGGElement, Node, SVGGElement>()
        .on("start", (d: Node) => {
            const event = getEvent(d3);

            if (!event.active) {
                simulation.alphaTarget(0.3).restart();
            }
            d.fx = d.x;
            d.fy = d.y;
        })
        .on("drag", (d: Node) => {
            const event = getEvent(d3);
            d.fx = event.x;
            d.fy = event.y;
        })
        .on("end", (d: Node) => {
            const event = getEvent(d3);
            if (!event.active) {
                simulation.alphaTarget(0);
            }
            d.fx = null;
            d.fy = null;
        });

    const node = svg
        .append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(graph.types)
        .enter()
        .append("g")
        .call(dragHandler);

    const prop = svg
        .append("g")
        .attr("class", "properties")
        .selectAll("circle")
        .data(graph.properties)
        .enter()
        .append("g")
        .call(dragHandler);

    const link = svg
        .append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(graph.links)
        .enter()
        .append("line");

    return { node, prop, link };
};

const createLinks = (graph: Readonly<Graph>) => {
    const links: Link[] = [];
    const allNodes = [...graph.types, ...graph.properties];

    for (const datum of allNodes) {
        if (isEnabled(graph, datum)) {
            datum.properties.forEach((prop) => {
                const target = allNodes.find((n: Node) => n.id === prop);
                if (target !== undefined) {
                    links.push({
                        source: datum,
                        target,
                    });
                }
            });
        }
    }

    return links;
};

const update = (graph: Graph, simulation: Simulation, svg: SVG) => {
    graph.links = createLinks(graph);
    const allNodes = [...graph.types, ...graph.properties];

    for (const datum of allNodes) {
        if (isEnabled(graph, datum)) {
            datum.properties.forEach((prop) => {
                const target = allNodes.find((n: Node) => n.id === prop);
                if (target !== undefined) {
                    graph.links.push({
                        source: datum,
                        target,
                    });
                }
            });
        }
    }

    const state = createState(graph, simulation, svg);

    simulation
        .nodes([...graph.types, ...graph.properties].filter((n: Node) => isVisible(graph, n)))
        .on("tick", () => {
            state.node.attr("transform", (d: Node) => `translate(${d.x}, ${d.y})`);

            state.prop.attr("transform", (d: Node) => `translate(${d.x}, ${d.y})`);

            state.link
                .attr("x1", (l: Link) => (isNode(l.source) ? l.source.x ?? 0 : 0))
                .attr("y1", (l: Link) => (isNode(l.source) ? l.source.y ?? 0 : 0))
                .attr("x2", (l: Link) => (isNode(l.target) ? l.target.x ?? 0 : 0))
                .attr("y2", (l: Link) => (isNode(l.target) ? l.target.y ?? 0 : 0));
        });

    simulation.force("link", d3.forceLink(graph.links));

    const setupDatums = (selection: DatumSelection) => {
        selection.append("circle").attr("r", (d: Node) => getRadius(d));

        selection
            .append("text")
            .attr("dx", 12)
            .attr("dy", 20)
            .text((d: Node) => d.id.replace(/_/g, " "));

        selection.on("click", (d: Node) => {
            if (isDisabled(graph, d)) {
                return;
            }

            d.userEnabled = !d.userEnabled;

            state.node.remove();
            state.prop.remove();
            state.link.remove();

            update(graph, simulation, svg);
        });

        const getAlpha = (n: Node) =>
            isEnabled(graph, n) ? 1.0 : isDisabled(graph, n) ? 0.1 : 0.5;

        selection.attr("display", (n: Node) => (isVisible(graph, n) ? "" : "none"));
        selection.selectAll<d3.BaseType, Node>("circle").attr(
            "fill",
            (n: Node) =>
                ({
                    "1": `rgba(43, 156, 212, ${getAlpha(n)})`,
                    "2": `rgba(43, 212, 156, ${getAlpha(n)})`,
                    property: `rgba(249, 182, 118, ${getAlpha(n)})`,
                    requirement: `rgba(212, 100, 100, ${getAlpha(n)})`,
                }[n.type]),
        );

        selection
            .selectAll<d3.BaseType, Node>("text")
            .attr("fill", (n: Node) => `rgba(0, 0, 0, ${getAlpha(n)})`);
    };

    setupDatums(state.node);
    setupDatums(state.prop);

    state.link.attr("display", (l) =>
        isNode(l.source) ? (isEnabled(graph, l.source) ? "" : "none") : "",
    );
    state.link.attr("stroke-width", 2);

    updateLists(graph);
};

const updateSize = (svg: SVG, simulation: Simulation, width: number, height: number) => {
    svg.attr("width", width);
    svg.attr("height", height);
    simulation.force("center", d3.forceCenter(width / 2, height / 2));
    simulation.force(
        "link",
        d3
            .forceLink<Node, Link>()
            .id((d: Node) => d.id)
            .distance((_d) => Math.min(width, height) * 0.1),
    );
};

const main = () => {
    const simulation = d3
        .forceSimulation<Node, Link>()
        .force(
            "collide",
            d3.forceCollide<Node>().radius((d: Node) => getRadius(d)),
        )
        .force("charge", d3.forceManyBody().strength(-10));

    const svg: SVG = d3.select("#content").append("svg");

    const { width, height } = getContentSize();
    const graph = defGraph();
    for (const node of [...graph.types, ...graph.properties]) {
        node.x = width * 0.5;
        node.y = height * 0.5;
    }

    window.addEventListener(
        "resize",
        () => {
            const { width, height } = getContentSize();
            updateSize(svg, simulation, width, height);
        },
        { passive: true },
    );

    updateSize(svg, simulation, width, height);
    update(graph, simulation, svg);
};

main();
