var addAssertions = require('./dom-assert').addAssertions;

exports.describeInDom = (message, testSuite) => {
    describe("[DOM Test]", () => {

        var context = {
            body: {
                remove: selector => {
                    $(document.body).find(selector).remove();
                }
            }
        };

        before(() => {
            addAssertions(context);
        });

        beforeEach(() => {
            // Simulate a 1024x768 viewport
            context.rootElement = $('<div style="width: 960px; height: 720px; position: relative"></div>');
            $(document.body).append(context.rootElement);
        });

        describe(message, () => {
            testSuite(context);
        });

        afterEach(() => {
            context.rootElement.remove();

            // The root element must not be accessible beyond that point
            delete context.rootElement;
        });

        after(() => {
            $(document.body).empty();
        });
    });
};
