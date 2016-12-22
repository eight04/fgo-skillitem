var clses = [
    "盾 シールダー 【Shielder】",
    "剣 セイバー　　【Saber】",
    "槍 ランサー 　【Lancer】",
    "弓 アーチャー　【Archer】",
    "騎 ライダー　 【Rider】",
    "術 キャスター　【Caster】",
    "殺 アサシン　 【Assassin】",
    "狂 バーサーカー【Berserker】",
    "裁 ルーラー 　【Ruler】",
    "讐 アヴェンジャー【Avenger】"
];

function assert(t) {
    if (!t) {
        throw new Error("Assertion error");
    }
}

var Servant = {
    create: function() {
        var servant = {
            ascension: {},
            skills: [{}, {}, {}]
        };
        Servant.reset(servant);
        return servant;
    },
    reset: function(servant) {
        servant.cls = -1;
        servant.id = -1;
        servant.hide = false;
        servant.ascension.min = 0;
        servant.ascension.max = 0;
        servant.skillset = 1;
        
        servant.skills.forEach(function(skill) {
            skill.min = 1;
            skill.max = 1;
        });
    },
    valid: function(servant) {
        assert(servant.cls == -1 || clses.map(function(cls){return cls[0]}).indexOf(servant.cls) >= 0);
        assert(servant.id == -1 || servants[servant.id]);
        assert(servant.ascension.min >= 0 && servant.ascension.min <= 4);
        assert(servant.ascension.max >= 0 && servant.ascension.max <= 4);
        assert(servant.skillset >= 1 && servant.skillset <= 3);
        servant.skills.forEach(function(skill) {
            assert(skill.min >= 1 && skill.min <= 10);
            assert(skill.max >= 1 && skill.max <= 10);
        });
    }
};

Vue.component("summary-table", {
    props: ["servants"],
    template: "#summary-table-template",
    computed: {
        items: function() {
            var items = {};
            
            function addItems(it) {
                var name, id;
                for (name in it) {
                    id = itemImage[name];
                    if (!items[id]) {
                        items[id] = {
                            id: id,
                            name: name,
                            count: 0
                        };
                    }
                    items[id].count += it[name];
                }
            }
            
            this.servants.forEach(function(servant) {
                if (!servants[servant.id]) return;
                
                servant.skills.forEach(function(skill) {
                    if (skill.min >= skill.max) return;
                    if (!servants[servant.id].skills) return;
                    
                    servants[servant.id].skills.slice(skill.min - 1, skill.max - 1).forEach(addItems);
                });
                
                if (!servants[servant.id].ascension) return;
                servants[servant.id].ascension.slice(servant.ascension.min, servant.ascension.max).forEach(addItems);
            });
            
            return items;
        },
        QP: function() {
            return this.items.QP ? this.items.QP.count : 0;
        },
        rows: function() {
            var key, item,
                rows = [[]];
            for (key in this.items) {
                item = this.items[key];
                if (item.id == "QP") continue;
                if (rows[rows.length - 1].length == 3) {
                    rows.push([]);
                }
                rows[rows.length - 1].push(item);
            }
            return rows;
        }
    }
});

function buildLvs(lvs, opt) {
    if (!lvs) return;
    var out = [];
    lvs.forEach(function(lv, i) {
        var o = {
            level: i + (opt.base || 0)
        };
        if (opt.itemId && objectEntries(lv).every(function(item){
            return itemImage[item[0]] != opt.itemId;
        })) {
            return;
        }
        if (opt.min != undefined && o.level < opt.min || opt.max != undefined && o.level > opt.max) {
            return;
        }
        o.items = objectEntries(lv).map(function(item) {
            return {
                id: itemImage[item[0]],
                name: item[0],
                count: item[1]
            };
        });
        out.push(o);
    });
    if (!out.length) return;
    return out;
}

function objectValues(o) {
    if (Object.values) {
        return Object.values(o);
    }
    var key, out = [];
    for (key in o) {
        out.push(o[key]);
    }
    return out;
}

Vue.component("item-search-result", {
    props: ["itemId", "skill", "ascension"],
    template: "#item-search-result-template",
    computed: {
        servants: function() {
            if (this.itemId < 0) return;
            var out = [];
            objectValues(servants).forEach(servant => {
                var o = objectClone(servant, ["id", "name"]);
                if (this.skill && servant.skills) {
                    o.skills = buildLvs(servant.skills, {
                        itemId: this.itemId,
                        base: 1
                    });
                }
                if (this.ascension && servant.ascension) {
                    o.ascension = buildLvs(servant.ascension, {
                        itemId: this.itemId,
                        base: 0
                    });
                }
                if (o.skills || o.ascension) {
                    out.push(o);
                }
            });
            return out;
        }
    }
})

Vue.component("item-table", {
    props: ["type", "lvs", "min", "max"],
    template: "#item-table-template",
    computed: {
        itemCount: function() {
            if (!this.lvs) return;
            return Math.max.apply(null, this.lvs.map(function(lv){
                return lv.items.length;
            }));
        },
        lvName: function() {
            if (this.type == "skill") {
                return "Slv";
            }
            if (this.type == "ascension") {
                return "靈基";
            }
        }
    }
});

Vue.filter("thousandComma", formatNumber);

function objectClone(o, props) {
    if (!Array.isArray(props)) {
        props = Object.keys(o);
    }
    var out = {};
    props.forEach(function(prop) {
        out[prop] = o[prop];
    });
    return out;
}

function createStorage(o) {
    var storage = {
        save: function() {
            localStorage[o.key] = JSON.stringify(o.getData());
        },
        load: function() {
            var data;
            try {
                data = JSON.parse(localStorage[o.key]);
                o.valid(data);
            } catch (err) {
                console.error(err);
                data = o.getDefault();
            }
            return data;
        }
    };
    return storage;
}

var storage = createStorage({
    key: "data",
    getData: function() {
        return objectClone(tab1, ["chinese", "summary", "servants"]);
    },
    getDefault: function() {
        return {
            chinese: false,
            summary: true,
            servants: []
        };
    },
    valid: function(data) {
        data.servants.forEach(Servant.valid);
    }
});

Vue.component("servant-panel", {
    props: ["servant", "servants"],
    template: "#servant-panel-template",
    computed: {
        skillLvs: function(){
            if (this.servant.id < 0) return;
            return buildLvs(servants[this.servant.id].skills, {base: 1});
        },
        ascensionLvs: function(){
            if (this.servant.id < 0) return;
            return buildLvs(servants[this.servant.id].ascension, {base: 0});
        },
        filteredServants: function(){
            if (this.servant.cls < 0) {
                return this.servants;
            }
            return this.servants.filter(servant => servant.cls == this.servant.cls);
        },
        clses: function() {
            return clses;
        }
    }
});

var tab1 = new Vue({
    el: "#tabs-1",
    data: storage.load(),
    computed: {
        servantCount: {
            get: function() {
                return this.servants.length;
            },
            set: function(value) {
                value = +value;
                if (this.servants.length > value) {
                    this.servants.splice(value);
                } else {
                    while (this.servants.length < value) {
                        this.addServant();
                    }
                }
            }
        },
        servantList: function() {
            var out = objectValues(servants);
            if (this.chinese) {
                out = out.map(translate);
            }
            return out;
        }
    },
    methods: {
        addServant: function() {
            this.servants.push(Servant.create());
        },
        reset: function() {
            this.servants.forEach(Servant.reset);
        }
    },
    watch: {
        chinese: storage.save,
        summary: storage.save,
        servants: {
            deep: true,
            handler: storage.save
        }
    }
});

new Vue({
    el: "#tabs-2",
    data: {
        items: buildItems({noQP: true}),
        skill: true,
        ascension: true,
        selected: -1
    }
});

function buildItems(opt) {
    var out = [], map = {};
    objectEntries(itemImage).forEach(function(item) {
        var o = {
            id: item[1],
            name: item[0]
        };
        if (o.name == "QP" && opt.noQP) return;
        if (map[o.id]) return;
        out.push(o);
        map[o.id] = true;
    });
    return out;
}

function translate(servant) {
    servant = $.extend({}, servant);
    if (svtChineseData[servant.id - 1]) {
        servant.name = svtChineseData[servant.id - 1].name;
    }
    return servant;
}

function objectEntries(o) {
    if (Object.entries) {
        return Object.entries(o);
    }
    var key, out = [];
    for (key in o) {
        out.push([key, o[key]]);
    }
    return out;
}

//右邊table可拖曳化
$(function() {
  $( "#summary-table" ).draggable({ cursor: "move" });
  $( "#tabs" ).tabs({ collapsible: true });
});

//千分位表示
function thousandComma(number) {
    var num = number.toString();
    var pattern = /(-?\d+)(\d{3})/;

    while(pattern.test(num)) {
        num = num.replace(pattern, "$1,$2");
    }
    return num;
}

function formatNumber(n) {
    if (n < 1000) return n;
    return thousandComma(Math.floor(n / 1000)) + " k";
}
