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

    applyTemplate(template) {
        for (let key in template) {
            switch (key.toLowerCase()) {
                case 'title':
                case 'text':
                    this.data[key] = template[key];
                    break;
                case 'groups':
                case 'vehicles':
                case 'members':
                    this.data[key] = [...new Set([...this.data[key], ...template[key]])]
                    break;
            }
        }
    }
}