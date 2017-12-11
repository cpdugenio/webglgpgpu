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
        get_image_pixels: function(ctx2d, w, h, image){
            ctx2d.clearRect(0,0,w,h)
            ctx2d.drawImage(image, 0, 0, w, h, 0, 0, w, h)
            var pixels = new Float32Array(
                canvas.getContext('2d').getImageData(0, 0, w, h).data
            );
            ctx2d.clearRect(0,0,w,h)
            return pixels;
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
        },

        loadbytestr: function(bytestr){
            decoded_bytestr = bytestr.split('').map(function(ch){
                return ch.charCodeAt(0);
            });
            datauint8 = new Uint8Array(decoded_bytestr);
            datafloat32 = new Float32Array(datauint8.buffer);
            return datafloat32;
        },
    };
});
