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

/**
 * https://simon-schraeder.de/posts/filereader-async/
 *
 * @param {File} file
 * @returns {Promise<string>}
 */
export function readFileAsync(file) {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onload = () => resolve(/** @type {string} */ (reader.result));
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

/**
 * Interface to abstract away the difference between a File and a URL.
 *
 * @typedef {object} VirtualFile
 * @prop {string} name
 * @prop {number} size
 * @prop {string} textContent
 */

/**
 * @param {File} file
 */
export async function uploadedFileToVirtualFile(file) {
    return {
        name: file.name,
        size: file.size,
        textContent: await readFileAsync(file),
    };
}

/**
 * @param {string} url
 */
export async function fetchToVirtualFile(url) {
    const response = await fetch(url);
    const textContent = await response.text();
    return {
        name: url.match(/[^/]*$/)[0],
        size: textContent.length,
        textContent,
    };
}
