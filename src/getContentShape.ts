import { Shape } from "./api";
import { getById } from "./getById";

export const getContentShape = (): Shape => {
    const content = getById("content");
    const width = content.clientWidth;
    const height = content.clientHeight;

    return { width, height };
};
