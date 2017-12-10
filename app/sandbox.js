require.config({
    baseUrl: "/app",
    paths: {
        // Note that text.js  is symlinked in /app to make text! easier
        // Note that image.js is symlinked in /app to make image! easier
    },
});

require(
    ["image!../res/balloon_cat.jpg"],
    function(balloon_cat){
        console.log("Helloworld");
		var canvas = document.createElement('canvas');
		var context = canvas.getContext('2d');
		canvas.width = balloon_cat.width;
		canvas.height = balloon_cat.height;
		context.drawImage(balloon_cat, 0, 0 );
		var myData = context.getImageData(0, 0, balloon_cat.width, balloon_cat.height);
		console.log(myData);
    }
);
