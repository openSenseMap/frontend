// import * as mqtt from "mqtt/dist/mqtt.min"; for web browser
import * as mqtt from 'mqtt' // ES6 modules (https://github.com/mqttjs/MQTT.js#es6-modules-import)

export async function checkMqttValidaty(mqttURL: string) {
	/* check mqtt url connection,
     it returns false if an issue occured while connecting to mqtt url
  */
	try {
		return await mqtt.connectAsync(mqttURL).then((_e) => {
			return true
		})
	} catch (error) {
		console.log(error)
		return false
	}
}
