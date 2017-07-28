"use strict";

exports.precondition = (check, message) => {
    if (check) {
        return;
    }
    throw new Error("Precondition: " + message);
};
