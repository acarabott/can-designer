import * as d3 from "d3";
import { Context, Datum, Link, Shape } from "./api";

export const updateSize = (ctx: Context, shape: Shape) => {
    ctx.views.root.attr("width", shape.width);
    ctx.views.root.attr("height", shape.height);
    ctx.model.simulation.force("center", d3.forceCenter(shape.width / 2, shape.height / 2));
    ctx.model.simulation.force(
        "link",
        d3
            .forceLink<Datum, Link>()
            .id((d: Datum) => d.id)
            .distance((_d) => Math.min(shape.width, shape.height) * 0.1),
    );
};
