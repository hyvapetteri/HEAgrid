"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var dialogs = require("tns-core-modules/ui/dialogs");
var fs = require("tns-core-modules/file-system");
var router_1 = require("nativescript-angular/router");
var session_1 = require("../../shared/session/session");
var StartPage = /** @class */ (function () {
    function StartPage(sessionProvider, routerExtensions) {
        this.sessionProvider = sessionProvider;
        this.routerExtensions = routerExtensions;
        this.submitted = false;
        this.name_invalid = true;
        this.name = sessionProvider.username;
    }
    StartPage.prototype.startEvaluation = function () {
        var _this = this;
        this.submitted = true;
        if (!this.name) {
            this.name_invalid = true;
        }
        else {
            this.name_invalid = false;
        }
        if (this.name_invalid) {
            return;
        }
        this.sessionProvider.username = this.name;
        var docsFolder = fs.knownFolders.documents();
        console.log(docsFolder.path);
        var fileHandle = docsFolder.getFile('participants.txt');
        fileHandle.readText().then(function (subjects) {
            var fullList = subjects.concat('subj: ' + _this.name + '\n');
            return fileHandle.writeText(fullList);
        }).then(function () {
            return dialogs.alert({
                title: 'Thank you!',
                message: 'Your participant ID is ' + _this.name,
                okButtonText: 'OK'
            });
        }).then(function () {
            _this.routerExtensions.navigate(["/volume"]);
        }).catch(function (err) {
            console.log(err);
        });
    };
    StartPage = __decorate([
        core_1.Component({
            moduleId: module.id,
            selector: 'page-start',
            templateUrl: './start.html',
            styleUrls: ['./start.css']
        }),
        __metadata("design:paramtypes", [session_1.SessionProvider,
            router_1.RouterExtensions])
    ], StartPage);
    return StartPage;
}());
exports.StartPage = StartPage;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhcnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzdGFydC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHNDQUEwQztBQUMxQyxxREFBdUQ7QUFDdkQsaURBQW1EO0FBQ25ELHNEQUErRDtBQUUvRCx3REFBK0Q7QUFRL0Q7SUFNRSxtQkFBb0IsZUFBZ0MsRUFDaEMsZ0JBQWtDO1FBRGxDLG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtRQUNoQyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWtCO1FBRXBELElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxJQUFJLEdBQUcsZUFBZSxDQUFDLFFBQVEsQ0FBQztJQUN2QyxDQUFDO0lBRUQsbUNBQWUsR0FBZjtRQUFBLGlCQWdDQztRQS9CQyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztRQUV0QixFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ2YsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7UUFDM0IsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ04sSUFBSSxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUM7UUFDNUIsQ0FBQztRQUVELEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1lBQ3RCLE1BQU0sQ0FBQTtRQUNSLENBQUM7UUFFRCxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBRTFDLElBQUksVUFBVSxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDN0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDN0IsSUFBSSxVQUFVLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBQ3hELFVBQVUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBQyxRQUFnQjtZQUMxQyxJQUFJLFFBQVEsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLFFBQVEsR0FBRyxLQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFDO1lBQzVELE1BQU0sQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3hDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNOLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO2dCQUNuQixLQUFLLEVBQUUsWUFBWTtnQkFDbkIsT0FBTyxFQUFFLHlCQUF5QixHQUFHLEtBQUksQ0FBQyxJQUFJO2dCQUM5QyxZQUFZLEVBQUUsSUFBSTthQUNuQixDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDTixLQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUM5QyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBQSxHQUFHO1lBQ1YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNuQixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUE5Q1UsU0FBUztRQU5yQixnQkFBUyxDQUFDO1lBQ1QsUUFBUSxFQUFFLE1BQU0sQ0FBQyxFQUFFO1lBQ25CLFFBQVEsRUFBRSxZQUFZO1lBQ3RCLFdBQVcsRUFBRSxjQUFjO1lBQzNCLFNBQVMsRUFBRSxDQUFDLGFBQWEsQ0FBQztTQUMzQixDQUFDO3lDQU9xQyx5QkFBZTtZQUNkLHlCQUFnQjtPQVAzQyxTQUFTLENBZ0RyQjtJQUFELGdCQUFDO0NBQUEsQUFoREQsSUFnREM7QUFoRFksOEJBQVMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCAqIGFzIGRpYWxvZ3MgZnJvbSBcInRucy1jb3JlLW1vZHVsZXMvdWkvZGlhbG9nc1wiO1xuaW1wb3J0ICogYXMgZnMgZnJvbSBcInRucy1jb3JlLW1vZHVsZXMvZmlsZS1zeXN0ZW1cIjtcbmltcG9ydCB7IFJvdXRlckV4dGVuc2lvbnMgfSBmcm9tIFwibmF0aXZlc2NyaXB0LWFuZ3VsYXIvcm91dGVyXCI7XG5cbmltcG9ydCB7IFNlc3Npb25Qcm92aWRlciB9IGZyb20gJy4uLy4uL3NoYXJlZC9zZXNzaW9uL3Nlc3Npb24nO1xuXG5AQ29tcG9uZW50KHtcbiAgbW9kdWxlSWQ6IG1vZHVsZS5pZCxcbiAgc2VsZWN0b3I6ICdwYWdlLXN0YXJ0JyxcbiAgdGVtcGxhdGVVcmw6ICcuL3N0YXJ0Lmh0bWwnLFxuICBzdHlsZVVybHM6IFsnLi9zdGFydC5jc3MnXVxufSlcbmV4cG9ydCBjbGFzcyBTdGFydFBhZ2Uge1xuICBwcml2YXRlIG5hbWU6IHN0cmluZztcblxuICBwcml2YXRlIHN1Ym1pdHRlZDogYm9vbGVhbjtcbiAgcHJpdmF0ZSBuYW1lX2ludmFsaWQ6IGJvb2xlYW47XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBzZXNzaW9uUHJvdmlkZXI6IFNlc3Npb25Qcm92aWRlcixcbiAgICAgICAgICAgICAgcHJpdmF0ZSByb3V0ZXJFeHRlbnNpb25zOiBSb3V0ZXJFeHRlbnNpb25zKSB7XG5cbiAgICB0aGlzLnN1Ym1pdHRlZCA9IGZhbHNlO1xuICAgIHRoaXMubmFtZV9pbnZhbGlkID0gdHJ1ZTtcbiAgICB0aGlzLm5hbWUgPSBzZXNzaW9uUHJvdmlkZXIudXNlcm5hbWU7XG4gIH1cblxuICBzdGFydEV2YWx1YXRpb24oKSB7XG4gICAgdGhpcy5zdWJtaXR0ZWQgPSB0cnVlO1xuXG4gICAgaWYgKCF0aGlzLm5hbWUpIHtcbiAgICAgIHRoaXMubmFtZV9pbnZhbGlkID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5uYW1lX2ludmFsaWQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5uYW1lX2ludmFsaWQpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIHRoaXMuc2Vzc2lvblByb3ZpZGVyLnVzZXJuYW1lID0gdGhpcy5uYW1lO1xuXG4gICAgbGV0IGRvY3NGb2xkZXIgPSBmcy5rbm93bkZvbGRlcnMuZG9jdW1lbnRzKCk7XG4gICAgY29uc29sZS5sb2coZG9jc0ZvbGRlci5wYXRoKTtcbiAgICBsZXQgZmlsZUhhbmRsZSA9IGRvY3NGb2xkZXIuZ2V0RmlsZSgncGFydGljaXBhbnRzLnR4dCcpO1xuICAgIGZpbGVIYW5kbGUucmVhZFRleHQoKS50aGVuKChzdWJqZWN0czogc3RyaW5nKSA9PiB7XG4gICAgICBsZXQgZnVsbExpc3QgPSBzdWJqZWN0cy5jb25jYXQoJ3N1Ymo6ICcgKyB0aGlzLm5hbWUgKyAnXFxuJyk7XG4gICAgICByZXR1cm4gZmlsZUhhbmRsZS53cml0ZVRleHQoZnVsbExpc3QpO1xuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgcmV0dXJuIGRpYWxvZ3MuYWxlcnQoe1xuICAgICAgICB0aXRsZTogJ1RoYW5rIHlvdSEnLFxuICAgICAgICBtZXNzYWdlOiAnWW91ciBwYXJ0aWNpcGFudCBJRCBpcyAnICsgdGhpcy5uYW1lLFxuICAgICAgICBva0J1dHRvblRleHQ6ICdPSydcbiAgICAgIH0pO1xuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgdGhpcy5yb3V0ZXJFeHRlbnNpb25zLm5hdmlnYXRlKFtcIi92b2x1bWVcIl0pO1xuICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgIH0pO1xuICB9XG5cbn1cbiJdfQ==