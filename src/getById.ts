export const getById = (id: string) => {
    const el = document.getElementById(id);
    if (el === null) {
        throw new ReferenceError(`No element with id "${id}"`);
    }
    return el;
};
