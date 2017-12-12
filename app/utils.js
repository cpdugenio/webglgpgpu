define(function(){
    function pad(pad, str, padLeft) {
      /* https://stackoverflow.com/a/24398129 */
      if (typeof str === 'undefined') 
        return pad;
      if (padLeft) {
        return (pad + str).slice(-pad.length);
      } else {
        return (str + pad).substring(0, pad.length);
      }
    }
    return {
        get_image_pixels: function(img){
            var canvas = document.createElement('canvas');
            var context = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            context.drawImage(img, 0, 0 );
            return context.getImageData(0, 0, img.width, img.height);
        },

        print_pixels: function(WHDN, data){
            var strgen = "";
            for(var row=0; row<WHDN.h; row++){
                for(var col=0; col<WHDN.w; col++){
                    if(col) strgen += ",";
                    strgen += pad('          ', data[row*WHDN.w+col].toFixed(2), true);
                }
                strgen += '\n';
            }
            console.log(strgen);
        },

        loadbytestr: function(bytestr){
            var datauint8 = new Uint8Array(
                bytestr.split('').map(function(ch){
                    return ch.charCodeAt(0);
                })
            );
            return new Float32Array(datauint8.buffer);
        },

        argmax: function(arr){
            var argmaxes = [];
            for(var p = 0; p<arr.length; p++){
                var currmax = -10000.0;
                var arg = -1;
                for(var v = 0; v<arr[p].length; v++){
                    if(arr[p][v] > currmax){
                        arg = v;
                        currmax = arr[p][v];
                    }
                }
                argmaxes.push(arg);
            }
            return argmaxes;
        }
    };
});
