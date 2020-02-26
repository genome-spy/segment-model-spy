/**
 *
 * @param {string} text
 */
export function* iterateLines(text) {
    const NEWLINE = 10;
    const RETURN = 13;
    const N = text.length;

    let i = 0;
    let first = i;
    while (i < N) {
        const c = text.charCodeAt(i++);
        /** @type {string} */
        let line;

        if (c === NEWLINE) {
            line = text.substring(first, i - 1);
        } else if (c === RETURN) {
            line = text.substring(first, i - 1);
            if (text.charCodeAt(i + 1) === NEWLINE) {
                i++;
            }
        } else if (i === N) {
            line = text.substring(first, i - 1);
        }

        if (line !== undefined) {
            yield line;
            line = undefined;
            first = i;
            if (i >= N) {
                return line;
            }
        }
    }
}

// https://simon-schraeder.de/posts/filereader-async/
export function readFileAsync(file) {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

export function waitForAnimationFrame() {
    return new Promise((resolve, reject) =>
        window.requestAnimationFrame(() =>
            window.requestAnimationFrame(resolve)
        )
    );
}
