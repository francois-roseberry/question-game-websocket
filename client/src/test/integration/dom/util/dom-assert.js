var precondition = require('./contract').precondition;

exports.addAssertions = context => {
    _.extend(context, assertionsOn(() => {
        // The rootElement will be reset between each run
        return context.rootElement;
    }));

    _.extend(context.body, assertionsOn(() => {
        return $(document.body);
    }));
};

function checkIsSelector(selector) {
    precondition(_.isString(selector), "Selector must be a string");
}

function assertionsOn(rootElement) {
    if (!_.isFunction(rootElement)) {
        // May happen during karma initialisation, so we log a descriptive error message, because karma won't
        console.log("Error: Cannot initiate assertions because the dom root element is not set!");
        throw new Error("Assertion must be done on an element!");
    }

    return {
        clickOn: (selector, allowMany) => {
            checkIsSelector(selector);

            var element = rootElement().find(selector);

            if (!allowMany && element.length !== 1) {
                throw new Error("Can only click on a single element, but " +
                    element.length +
                    " found");
            }

            if (!element.is(":visible")) {
                throw new Error("Cannot click on the element, because it is not visible");
            }

            element.click();
        },

	enterTextIn: (selector, text) => {
		checkIsSelector(selector);

		var element = rootElement().find(selector);

            if (element.length !== 1) {
                throw new Error("Can only enter text in a single element, but " +
                    element.length +
                    " found");
            }

		if (!element.is(":visible")) {
                throw new Error("Cannot enter text in the element, because it is not visible");
            }

		element.val(text);
		element.trigger('input');
	},

        d3: d3Actions(),

        assertOneOf: selector => {
            checkIsSelector(selector);

            var elementCount = rootElement().find(selector).length;

            if (elementCount === 0) {
                throw new Error("Can't find any DOM element with selector '" + selector + "'");
            }

            if (elementCount > 1) {
                throw new Error(
                    "Found " + elementCount +
                    " elements with selector '" + selector +
                    "', expected unique");
            }
        },

        assertNothingOf: selector => {
            checkIsSelector(selector);

            var elementCount = rootElement().find(selector).length;

            if (elementCount !== 0) {
                throw new Error(
                    "Found " + elementCount + " elements with selector '" + selector + "' but none should exists");
            }
        },

        assertElementCount: (selector, expectedCount) => {
            checkIsSelector(selector);

            var elementCount = rootElement().find(selector).length;

            if (elementCount !== expectedCount) {
                throw new Error("Didn't find " + expectedCount +
                    " DOM elements with selector '" + selector + "', " + elementCount + " found instead");
            }
        },

        assertVisible: (selector) => {
            checkIsSelector(selector);

            if (!isVisible(rootElement(), selector)) {
                throw new Error("Element " + selector + " is not visible as expected");
            }
        },

        assertHidden: selector => {
            checkIsSelector(selector);

            if (isVisible(rootElement(), selector)) {
                throw new Error("Element " + selector + " is visible while it should be hidden");
            }
        },

        assertText: (selector, textContent) => {
            checkIsSelector(selector);

            var actualText = rootElement().find(selector).text();

            if (actualText !== textContent) {
                throw new Error("Element " + selector + " should contains text [" +
                    textContent + "] but instead contains [" + actualText + "]");
            }
        },

        assertTextIsPresent: (selector, textContent) => {
            checkIsSelector(selector);

            var actualText = rootElement().find(selector).html();

            if (actualText.indexOf(textContent) === -1) {
                throw new Error("Element " + selector + " should contains text [" +
                    textContent + "] but it was not found in [" + actualText + "]");
            }
        },

        assertCssClass: (selector, cssClass) => {
            checkIsSelector(selector);

            var element = rootElement().find(selector);

            if (!element.hasClass(cssClass)) {
                throw new Error("Element " + selector +
                    " do not contains expected css class '" + cssClass + "'");
            }
        },

        assertAbsentCssClass: (selector, cssClass) => {
            checkIsSelector(selector);

            var element = rootElement().find(selector);

            if (element.hasClass(cssClass)) {
                throw new Error("Element " + selector +
                    " contains unwanted css class '" + cssClass + "'");
            }
        },

        assertSelectionContainsAttributeValues: (selector, attribute, expectedValues) => {
            checkIsSelector(selector);

            var foundValues = _.map(rootElement().find(selector), item => $(item).attr(attribute));

            expectedValues.forEach(value => {
                if (!_.contains(foundValues, value)) {
                    throw new Error("No element with selector " + selector +
                        " has attribute " + attribute + "=" + value +
					', values found=' + JSON.stringify(foundValues));
                }
            });
        },

        assertSelectionHasTextValuesInOrder: (selector, expectedValues) => {
            checkIsSelector(selector);

            var foundValues = _.map(rootElement().find(selector), item => $(item).text());

            if (foundValues.length !== expectedValues.length) {
                throw new Error("Not enough elements with selector " + selector +
                    ", found " + foundValues.length + ", expected " + expectedValues.length);
            }

            _.each(expectedValues, (value, index) => {
                if (value !== foundValues[index]) {
                    throw new Error("Element [" + index + "] with selector " + selector +
                        " was expected to have its text attribute with value " + value +
                        ", instead its value was " + foundValues[index]);
                }
            });
        },

        assertDisabled: selector => {
            checkIsSelector(selector);

            if (!isDisabled(rootElement(), selector)) {
                throw new Error('Found an element with selector ' + selector + ' which is not disabled');
            }
        },

        assertEnabled: selector => {
            checkIsSelector(selector);

            if (isDisabled(rootElement(), selector)) {
                throw new Error('Found an element with selector ' + selector + ' which is disabled');
            }
        }
    };
}

function isDisabled(element, selector) {
    checkIsSelector(selector);

    return element.find(selector).is(':disabled');
}

function isVisible(element, selector) {
    checkIsSelector(selector);

    return element.find(selector).is(":visible");
}

function d3Actions() {
    return {
        clickOn: selector => {
            d3Trigger(selector, "click");
        },

        hoverOn: selector => {
            d3Trigger(selector, "mouseover");
        },

        hoverOff: selector => {
            d3Trigger(selector, "mouseout");
        }
    };
}

function d3Trigger(selector, eventName) {
    checkIsSelector(selector);

    var elements = d3.selectAll(selector)[0];
    var event = document.createEvent("MouseEvent");
    event.initMouseEvent(eventName, true, true);
    _.each(elements, element => {
        element.dispatchEvent(event);
    });
}
