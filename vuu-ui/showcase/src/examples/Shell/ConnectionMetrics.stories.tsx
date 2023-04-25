import { SubscribeCallback, useServerConnectionQuality } from "@finos/vuu-data"
import { ErrorDisplay, useSchemas, useTestDataSource } from "../utils"
import { useCallback } from "react";


export const ConnectionMetrics = () => {
	const pricesTableColumns = ["ask", "askSize", "bid", "bidSize", "close", "last", "open", "phase", "ric", "scenario"];
	const messagesPerSecond = useServerConnectionQuality();
	const { schemas } = useSchemas();
	const { error, dataSource } = useTestDataSource({
		schemas,
		tablename: "prices"
	});
	const dataSourceHandler:SubscribeCallback = useCallback(
		(message) => {
			return message
	}, [])

	dataSource.subscribe({columns: pricesTableColumns}, dataSourceHandler)
	if (error) return <ErrorDisplay>{error}</ErrorDisplay>

	return <div>Connection Speed: {messagesPerSecond} msgs/s</div>
}