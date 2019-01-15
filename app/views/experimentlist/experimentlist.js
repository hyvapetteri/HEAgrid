"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var page_1 = require("ui/page");
var dialogs = require("tns-core-modules/ui/dialogs");
var router_1 = require("nativescript-angular/router");
var environment_1 = require("../../config/environment");
var volumeobserver_1 = require("../../shared/volumeobserver");
var session_1 = require("../../shared/session/session");
var appSettings = require("tns-core-modules/application-settings");
var ExperimentListPage = /** @class */ (function () {
    function ExperimentListPage(sessionProvider, routerExtensions, page) {
        var _this = this;
        this.sessionProvider = sessionProvider;
        this.routerExtensions = routerExtensions;
        this.page = page;
        this.listItems = [];
        this.listItems.push({ type: "header", text: "Start new experiment by selecting test frequency below" });
        for (var i = 0; i < environment_1.testfrequencies.length; i++) {
            var item = { type: "test" };
            item.text = "" + environment_1.testfrequencies[i].label;
            item.frequency = environment_1.testfrequencies[i].value;
            this.listItems.push(item);
        }
        this.listItems.push({ type: "header", text: "Previous experiments in the current session" });
        var experimentList = sessionProvider.getExperiments();
        for (var i = 0; i < experimentList.length; i++) {
            var item = { type: "history" };
            item.text = "" + experimentList[i].type + " " + experimentList[i].testFrequency + " Hz (" + experimentList[i].status + ")";
            if (experimentList[i].status == session_1.ExperimentStatus.Finished) {
                var grid = experimentList[i].grid;
                var history_1 = grid.getHistory();
                var n_avg = 6;
                var counter_avg = 0;
                var sum_avg = 0;
                for (var i_1 = history_1.length - 1; i_1 >= 0; i_1--) {
                    if (history_1[i_1].reversal && (history_1[i_1].xval == 0)) {
                        sum_avg += history_1[i_1].yval;
                        counter_avg += 1;
                        if (counter_avg == n_avg) {
                            break;
                        }
                    }
                }
                var threshold = sum_avg / n_avg;
                item.text += ", th " + threshold;
            }
            item.experimentId = i + 1;
            this.listItems.push(item);
        }
        this.page.on("navigatedTo", function (data) {
            console.log("adding volume observer");
            var audioSession = AVAudioSession.sharedInstance();
            _this.masterVolumeObserver = new volumeobserver_1.VolumeObserver();
            _this.masterVolumeObserver.setCallback(function (obj) {
                dialogs.alert({
                    title: "Volume changed!",
                    message: "A volume button press was observed. The current experiment will be cancelled and you will now return to the volume setting screen.",
                    okButtonText: "OK"
                }).then(function () {
                    return _this.routerExtensions.navigate(["/volume"], { clearHistory: true });
                }).catch(function (err) { return console.log(err); });
            });
            audioSession.addObserverForKeyPathOptionsContext(_this.masterVolumeObserver, "outputVolume", 1 /* New */, null);
        });
        this.page.on("navigatingFrom", function (data) {
            console.log("removing volume observer");
            var audioSession = AVAudioSession.sharedInstance();
            audioSession.removeObserverForKeyPath(_this.masterVolumeObserver, "outputVolume");
        });
    }
    ExperimentListPage.prototype.handleTap = function (tapEvent) {
        var _this = this;
        if (this.listItems[tapEvent.index].type === "test") {
            var pickedFreq_1 = this.listItems[tapEvent.index].frequency;
            var targ_key = "";
            if (pickedFreq_1 == 1000) {
                targ_key = "spl_tone1k";
            }
            else if (pickedFreq_1 == 2000) {
                targ_key = "spl_tone2k";
            }
            else if (pickedFreq_1 == 4000) {
                targ_key = "spl_tone4k";
            }
            var targ_ref_level = void 0;
            if (appSettings.hasKey(targ_key)) {
                targ_ref_level = appSettings.getNumber(targ_key);
            }
            else {
                return this.showError("Calibrate levels first!");
            }
            return dialogs.action({
                title: "Experiment type",
                cancelButtonText: "Cancel",
                actions: ["Grid (default)", "AFC, no gap", "AFC, 0.2 gap"]
            }).then(function (result) {
                _this.sessionProvider.startExperiment(pickedFreq_1);
                if (result === "Grid (default)") {
                    _this.sessionProvider.getCurrentExperiment().type = session_1.ExperimentType.Grid;
                }
                else if (result === "AFC, no gap") {
                    _this.sessionProvider.getCurrentExperiment().type = session_1.ExperimentType.SingleRunNoGap;
                }
                else if (result === "AFC, 0.2 gap") {
                    _this.sessionProvider.getCurrentExperiment().type = session_1.ExperimentType.SingleRunWithGap;
                }
                else {
                    _this.sessionProvider.cancelExperiment();
                    return;
                }
                return _this.routerExtensions.navigate(["/threshold"], { clearHistory: true }).catch(function (err) {
                    console.log(err);
                });
            });
        }
        else if (this.listItems[tapEvent.index].type === "history") {
            var pickedExperiment = this.listItems[tapEvent.index].experimentId;
            return this.routerExtensions.navigate(["/gridplot", pickedExperiment]).catch(function (err) {
                console.log(err);
            });
        }
    };
    ExperimentListPage.prototype.templateSelector = function (item, index, items) {
        return item.type;
    };
    ExperimentListPage.prototype.showActionSheet = function () {
        var _this = this;
        dialogs.action({
            title: 'Send the results',
            message: 'version 0.1',
            cancelButtonText: 'Cancel',
            actions: ['Calibrate', 'Send with email', 'Quit']
        }).then(function (result) {
            console.log(result);
            if (result == "Calibrate") {
                return _this.routerExtensions.navigate(['/calibration']);
            }
            else if (result == "Quit") {
                _this.sessionProvider.resetSession();
                return _this.routerExtensions.navigate(['/start'], { clearHistory: true });
            }
        }).catch(function (err) { return console.log(err); });
    };
    ExperimentListPage.prototype.sendResults = function () {
    };
    ExperimentListPage.prototype.showError = function (err) {
        return dialogs.alert({
            title: 'Error',
            message: err,
            okButtonText: 'Close'
        }).then(function () {
            // pass
        });
    };
    ExperimentListPage = __decorate([
        core_1.Component({
            moduleId: module.id,
            selector: 'page-experimentlist',
            templateUrl: './experimentlist.html'
        }),
        __metadata("design:paramtypes", [session_1.SessionProvider,
            router_1.RouterExtensions,
            page_1.Page])
    ], ExperimentListPage);
    return ExperimentListPage;
}());
exports.ExperimentListPage = ExperimentListPage;
