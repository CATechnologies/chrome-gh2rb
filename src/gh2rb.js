window.gh2rb = {
    __version__: '0.0.1',
    __license__: 'MIT',
    __author__: 'Ye Liu',
    __contact__: 'yeliu@instast.com',
    __copyright__: 'Copyright (c) 2014 Ye Liu',

    projects: null,

    loadProjects: function(callback) {
        var me = this;
        chrome.storage.sync.get({'projects': []}, function(result) {
            if (chrome.runtime.lastError) {
                console.log(chrome.runtime.lastError.message);
                result = {projects: []};
            }
            me.projects = result.projects;
            callback(false, result.projects);
        });
    },

    saveProjects: function(callback) {
        var me = this;

        function doSave() {
            chrome.storage.sync.set({'projects': me.projects}, function() {
                if (chrome.runtime.lastError) {
                    console.log(chrome.runtime.lastError.message);
                    callback(chrome.runtime.lastError);
                } else {
                    callback(false);
                }
            });
        }
        
        if (me.projects) {
            doSave();
        } else {
            me.loadProjects(doSave);
        }
    },

    addProject: function(name, id, callback) {
        var me = this;

        if (!name || !id) {
            callback({message: 'name and id are required'});
            return;
        }

        function doAddProject() {
            if (me.indexOf(name, id) >= 0) {
                callback(false);
            } else {
                me.projects.push({name: name, id: id});
                me.saveProjects(callback);
            }
        }

        if (me.projects) {
            doAddProject();
        } else {
            me.loadProjects(doAddProject);
        }
    },

    removeProject: function(name, id, callback) {
        var me = this;

        if (!name || !id) {
            callback({message: 'name and id are required'});
            return;
        }

        function doRemoveProject() {
            var index = me.indexOf(name, id);
            var proj;

            if (index >= 0) {
                proj = me.projects.splice(index, 1)[0];
                me.saveProjects(function(err) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(false, proj);
                    }
                });
            } else {
                callback({message: 'project not exists'});
            }
        }

        if (me.projects) {
            doRemoveProject();
        } else {
            me.loadProjects(doRemoveProject);
        }
    },

    indexOf: function(name, id, callback) {
        var me = this;
        var proj;

        if (!me.projects) {
            return -1;
        }

        for (var i = 0, len = me.projects.length; i < len; i++) {
            proj = me.projects[i];
            if (proj.name === name && proj.id === id) {
                return i;
            }
        }

        return -1;
    },

    onMessage: function(request, sender, sendResponse) {
        var me = this;
        var fn = request.fn;
        var params = request.params || [];

        if (Object.prototype.toString.call(me[fn]) === '[object Function]') {
            params.push(function() {
                var results = Array.prototype.slice.call(arguments);
                var error = results.splice(0, 1)[0];
                sendResponse({
                    error: error,
                    results: results
                });
            });

            me[fn].apply(me, params);
            return true;
        } else {
            sendResponse({
                error: 'fn ' + fn + ' is not a function'
            });
        }
    },
};

chrome.runtime.onMessage.addListener(function() {
    return window.gh2rb.onMessage.apply(window.gh2rb, arguments);
});
