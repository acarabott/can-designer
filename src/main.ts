import * as d3 from "d3";
import {
    DatumSelection,
    Graph,
    GraphDef,
    isNode,
    Link,
    Node,
    NodeDef,
    Simulation,
    State,
    SVG,
} from "./api";
import { getById } from "./getById";

const getContentSize = () => {
    const content = getById("content");
    const width = content.clientWidth;
    const height = content.clientHeight;

    return { width, height };
};

const clearState = (state: State) => {
    state.node.remove();
    state.prop.remove();
    state.link.remove();
};

const createState = (graph: Graph, simulation: Simulation, svg: SVG) => {
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

const updateLists = (graph: Graph) => {
    const list = getById("list");
    const requirements = getById("requirements");
    const suggestions = getById("suggestions");

    for (const ul of [list, requirements, suggestions]) {
        for (const child of Array.from(ul.children)) {
            child.remove();
        }
    }

    const defLi = (datum: Node) => {
        const li = document.createElement("li");
        li.textContent = datum.id.replace(/_/g, " ");
        return li;
    };

    for (const datum of graph.types) {
        if (datum.userEnabled || (datum.enabled && datum.type !== "requirement")) {
            list.appendChild(defLi(datum));
        }
    }

    for (const datum of graph.properties) {
        if (datum.visible || (datum.enabled && !datum.userEnabled)) {
            const list = datum.type === "requirement" ? requirements : suggestions;
            list.appendChild(defLi(datum));
        }
    }
};

const update = (graph: Graph, simulation: Simulation, svg: SVG) => {
    graph.links = [];
    const allNodes = [...graph.types, ...graph.properties];
    for (const datum of allNodes) {
        if (datum.enabled) {
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
        .nodes([...graph.types, ...graph.properties].filter((n: Node) => n.visible))
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
        selection.append("circle").attr("r", (d: Node) => d.radius);

        selection
            .append("text")
            .attr("dx", 12)
            .attr("dy", 20)
            .text((d: Node) => d.id.replace(/_/g, " "));

        selection.on("click", (d: Node) => {
            if (d.disabled) {
                return;
            }
            d.toggle();
            clearState(state);
            update(graph, simulation, svg);
        });

        const getAlpha = (n: Node) => (n.enabled ? 1.0 : n.disabled ? 0.1 : 0.5);

        selection.attr("display", (n: Node) => (n.visible ? "" : "none"));
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

    state.link.attr("display", (l) => (isNode(l.source) ? (l.source.enabled ? "" : "none") : ""));
    state.link.attr("stroke-width", 2);

    updateLists(graph);
};

const createNode = (graph: Graph, def: NodeDef, startPos: { x: number; y: number }): Node => {
    return {
        ...def,
        userEnabled: false,
        enable() {
            this.userEnabled = true;
        },
        disable() {
            this.userEnabled = false;
        },
        toggle() {
            this.userEnabled = !this.userEnabled;
        },
        ...startPos,
        get visible() {
            if (["1", "2"].includes(def.type)) {
                return true;
            }

            return [...graph.types, ...graph.properties]
                .filter((node) => node.properties.includes(def.id))
                .some((node) => node.enabled);
        },
        get enabled() {
            const enabledByOther = def.enabledBy.some((ids) => {
                return [...graph.types, ...graph.properties]
                    .filter((node) => ids.includes(node.id))
                    .every((node) => node.enabled);
            });
            let requirementEnabled = false;
            if (def.type === "requirement") {
                const parent = [...graph.types, ...graph.properties].find((node) => {
                    return node.properties.includes(def.id);
                });
                requirementEnabled = parent !== undefined && parent.enabled;
            }

            return this.userEnabled || enabledByOther || requirementEnabled;
        },
        get disabled() {
            return def.disabledBy.some((ids) => {
                return [...graph.types, ...graph.properties]
                    .filter((node) => ids.includes(node.id))
                    .every((node) => node.enabled);
            });
        },
        get radius() {
            const radii = {
                1: 50,
                2: 40,
                property: 20,
                requirement: 30,
            } as const;

            return radii[def.type];
        },
    };
};

const main = (graphDef: GraphDef) => {
    const { width, height } = getContentSize();
    const startPos = { x: width * 0.5, y: height * 0.5 };
    
    const simulation = d3
        .forceSimulation<Node, Link>()
        .force(
            "link",
            d3
                .forceLink<Node, Link>()
                .id((d: Node) => d.id)
                .distance((_d) => 150),
        )
        .force("charge", d3.forceManyBody().strength(-10))
        .force(
            "collide",
            d3.forceCollide<Node>().radius((d: Node) => d.radius),
        );

    const svg: SVG = d3.select("#content").append("svg");

    const updateSize = (width: number, height: number) => {
        svg.attr("width", width);
        svg.attr("height", height);
        simulation.force("center", d3.forceCenter(width / 2, height / 2));
    };

    const graph: Graph = {
        types: [],
        properties: [],
        links: [],
    };

    graph.types = graphDef.types.map((def) => createNode(graph, def, startPos));
    graph.properties = graphDef.properties.map((def) => createNode(graph, def, startPos));

    window.addEventListener(
        "resize",
        () => {
            const { width, height } = getContentSize();
            updateSize(width, height);
        },
        { passive: true },
    );

    updateSize(width, height);
    update(graph, simulation, svg);
};

d3.json("data/numbers.json", (error, graphDef: GraphDef) => {
    if (error) {
        throw error;
    }

    main(graphDef);
});
