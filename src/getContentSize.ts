import { getById } from "./getById";

export const getContentSize = () => {
    const content = getById("content");
    const width = content.clientWidth;
    const height = content.clientHeight;

    return { width, height };
};
