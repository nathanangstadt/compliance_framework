const jetVer = "19.0.0";
const iconVer = "2601.0.0";
var cdn = "";  //Local static serving

try {
    const cdnPing = new XMLHttpRequest();
    cdnPing.open("GET", cdn + "/fnd/gallery/" + iconVer + "/OracleFont/OracleFont.min.css", false);
    cdnPing.send();
} catch (error) { //Use internal CDN, intended for disconnected (ONSR) realms
    cdn = "node_modules/cdn";
} finally {
    //These need to be vars for usage in app
    var cdnJet = cdn + "/jet/" + jetVer;
    var cdnReqConfig = cdnJet.includes("node_modules") ? "../" + cdnJet : cdnJet;
    var cdnIcons = cdn + "/fnd/gallery/" + iconVer;
    var cdnJet18 = cdnJet.includes("node_modules") ? "../" + cdn + "/jet/18.1.0"  : cdn + "/jet/18.1.0";
}
