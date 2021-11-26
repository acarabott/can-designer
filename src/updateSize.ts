import { forceCenter, forceLink } from "d3-force";
import { Context, Link, Node, Shape } from "./api";

export const updateSize = (ctx: Context, shape: Shape) => {
    ctx.views.root.attr("width", shape.width);
    ctx.views.root.attr("height", shape.height);
    ctx.model.simulation.force("center", forceCenter(shape.width / 2, shape.height / 2));
    ctx.model.simulation.force(
        "link",
        forceLink<Node, Link>()
            .id((d: Node) => d.id)
            .distance((_d) => Math.min(shape.width, shape.height) * 0.1),
    );
};
