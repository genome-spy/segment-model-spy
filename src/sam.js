import { iterateLines } from "./utils.js";

/**
 * Parses a SAM header.
 * Based roughly on https://github.com/samtools/hts-specs
 *
 * TODO: Write a test
 *
 * @param {string} textContent
 */
export function parseSamHeader(textContent) {
    /** @type {Record.<string, object>[]} */
    const records = {};

    const addRecord = (type, record) => {
        if (!records[type]) {
            records[type] = [];
        }
        records[type].push(record);
    };

    for (const line of iterateLines(textContent)) {
        const match = line.match(/^@([A-Z]{2})\t(.*)/);
        if (match) {
            const type = match[1];
            if (type === "CO") {
                addRecord(type, commentMatch[1]);
            } else {
                const record = Object.fromEntries(
                    match[2]
                        .split("\t")
                        .map((token) =>
                            token.match(/^([A-Za-z][A-Za-z0-9]):(.*)/)
                        )
                        .filter((match) => match)
                        .map((match) => match.slice(1))
                );
                addRecord(type, record);
            }
        } else {
            break;
        }
    }

    return records;
}
