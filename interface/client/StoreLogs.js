var interactionLogs = [];

export function storeInteractionLogs(interaction, value, time) {
    // console.log({ Interaction: interaction, Value: value, Time: time.getTime() });
    interactionLogs.push({
    Interaction: interaction,
    Value: value,
    Time: time.getTime(),
 });
}