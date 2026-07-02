import {
    EventBridgeClient,
    PutEventsCommand,
} from "@aws-sdk/client-eventbridge";

import {
    unmarshall,
} from "@aws-sdk/util-dynamodb";

const eventBridgeClient =
    new EventBridgeClient({});
const eventMappings = [
    {
        field: "price",
        detailType: "ProductPriceChanged",
        oldKey: "oldPrice",
        newKey: "newPrice",
    },
    {
        field: "stock",
        detailType: "ProductStockChanged",
        oldKey: "oldStock",
        newKey: "newStock",
    },
    {
        field: "productName",
        detailType: "ProductNameChanged",
        oldKey: "oldName",
        newKey: "newName",
    },
];

export const handler = async (
    event: any
): Promise<void> => {
    console.log(
        "Received DynamoDB Stream Event"
    );

    for (const record of event.Records) {
        // Process only UPDATE events
        if (record.eventName !== "MODIFY") {
            continue;
        }

        const oldImage = unmarshall(
            record.dynamodb.OldImage
        );

        const newImage = unmarshall(
            record.dynamodb.NewImage
        );

        const events = [];

        for (const mapping of eventMappings) {

            if (
                oldImage[mapping.field] !==
                newImage[mapping.field]
            ) {

                console.log(
                    `${mapping.field} changed`
                );

                events.push({
                    Source: "product.service",

                    DetailType: mapping.detailType,

                    EventBusName:
                        process.env.EVENT_BUS_NAME,

                    Detail: JSON.stringify({
                        productId:
                            newImage.productId,

                        [mapping.oldKey]:
                            oldImage[mapping.field],

                        [mapping.newKey]:
                            newImage[mapping.field],
                    }),
                });

            }

        }

        /*
        ==========================
        Publish Events
        ==========================
        */

        if (events.length > 0) {
            await eventBridgeClient.send(
                new PutEventsCommand({
                    Entries: events,
                })
            );

            console.log(
                `Published ${events.length} event(s) to EventBridge`
            );
        } else {
            console.log(
                "No business changes detected."
            );
        }
    }
};