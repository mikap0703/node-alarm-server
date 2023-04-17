export default class AlarmTemplate {
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
}