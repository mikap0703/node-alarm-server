export default class AlarmBuilder {
    constructor(logger) {
        this.logger = logger;
        this.data = {
            "id": "",
            "title": "",
            "text": "",
            "time": 0,
            "address": {
                "street": "",
                "city": "",
                "object": "",
                "objectId": "",
                "info": "",
            },
            "groups": [],
            "vehicles": [],
            "members": []
        };
    }

    addUnits(type, units) {
        this.data[type] = [...new Set([...this.data[type], ...units])]
    }
}