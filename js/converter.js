$(document).ready(function () {
    $("#copy-hex").click(function (){
        var output = $("#output-hex-text")
        var copied = $("#output-hex-copied")

        var tempTextarea = $("<textarea>");
        tempTextarea.val(output.text());

        output.select()
        document.execCommand("copy");
        $("body").append(tempTextarea);
        tempTextarea.select();
        document.execCommand("copy");
        tempTextarea.remove();

        copied.css("visibility", "visible")
    })

    //Copies the binary text
    $("#copy-binary").click(function (){
        var output = $("#output-binary-text")
        var copied = $("#output-binary-copied")

        var tempTextarea = $("<textarea>");
        tempTextarea.val(output.text());

        output.select()
        document.execCommand("copy");
        $("body").append(tempTextarea);
        tempTextarea.select();
        document.execCommand("copy");
        tempTextarea.remove();

        copied.css("visibility", "visible")
    })
    
    //Does the function
    $("#submit-input").click(function () {
        var mantissa = $("#mantissa-input").val() 
        var exponent = $("#exponent-input").val()

        var outputBinary = $("#output-binary-text")
        var outputHexadecimal = $("#output-hex-text")
        
        var error_div = $(".input-error")
        var error_text = $("#input-error-text")

        var base = $("#base").val()

        $("#output-binary-copied").css("visibility", "hidden")
        $("#output-hex-copied").css("visibility", "hidden")

        mantissaInputError = mantissaInputCheck(base, mantissa)
        exponentInputError = exponentInputCheck(exponent)

        if(mantissaInputError){
            error_text.text(mantissaInputError)
            error_div.css("visibility", "visible")
        }
        else if(exponentInputError){
            error_text.text(exponentInputError)
            error_div.css("visibility", "visible")
        }
        else{
            error_div.css("visibility", "hidden")
            
            if(base == 10){
                mantissa = convertDecToBin(mantissa)
            }

            if(exponent == "") exponent = 0

            actual_output = converttoBinary64(mantissa, exponent)
            outputBinary.text(actual_output.output)
            outputHexadecimal.text(actual_output.hex)
            if(actual_output) $(".area-output").css("visibility", "visible")
        }
        
        function convertDecToBin(mantissa){
            let radixPoint = mantissa.indexOf('.')
            if(radixPoint == -1) return parseInt(mantissa).toString(2)

            //divide mantissa to two
            let upper = mantissa.slice(0, radixPoint)
            let lower = mantissa.slice(radixPoint + 1, mantissa.length)

            if(!lower) lower = 0

            upper = parseInt(upper).toString(2)
            lower = parseInt(lower).toString(2)

            return upper + "." + lower
        }

        function normalize(mantissa, exponent){
            exponent = parseInt(exponent)

            if(!mantissa || mantissa == 0){
                mantissa = "0"
                console.log("Normalized Mantissa: " + mantissa)
                console.log("Normalized Exponent: " + exponent)
                return {mantissa: mantissa, exponent: exponent}
            }

            //get mantissa sign
            let sign = mantissa[0] === '-' ? '-' : ''; //if neg => -, else ''
            
            //remove '-' to perform calculations easier
            mantissa = mantissa.replace('-', ''); 

            //if mantissa starts with "1." then it is already normalized
            if(mantissa[0] == 1 && mantissa[1] == '.') {
                console.log("Normalized Mantissa: " + mantissa)
                console.log("Normalized Exponent: " + exponent)
                return {mantissa: sign + mantissa, exponent: exponent}
            }
            //get radix point pos
            let radixPoint = mantissa.indexOf('.')
            if(radixPoint == -1) radixPoint = mantissa.length
            radixPoint = parseInt(radixPoint)
            
            //remove radix point
            mantissa = mantissa.replace('.', '')
            //get 1 pos
            let posOf1 = mantissa.indexOf('1')
            console.log(posOf1)

            //divide mantissa to two
            let upper = mantissa.slice(0, posOf1 + 1)
            let lower = mantissa.slice(posOf1 + 1, mantissa.length)

            //remove all 0s in upper
            upper = upper.replaceAll('0', '')
            
            //put back radix point
            upper = upper.concat('.')
            
            //mantissa done
            mantissa = sign + upper + lower

            exponent = exponent + radixPoint - posOf1 - 1

            console.log("Normalized Mantissa: " + mantissa)
            console.log("Normalized Exponent: " + exponent)
            return {mantissa: mantissa, exponent: exponent}
            
        }
    
        function converttoBinary64(mantissa, exponent) { 
            let signBit = mantissa[0] === '-' ? '1': '0';
            
            //normalize mantissa
            let normalized = normalize(mantissa, exponent);
            let normalizedMantissa = normalized.mantissa;
            let normalizedExponent = normalized.exponent;
    
            //get e'
            let biasedExponent = normalizedExponent + 1023;
    
            //Convert e' to binary and pad to 11 bits
            let eprime = biasedExponent.toString(2).padStart(11, '0');
            
            //pad normalized mantissa to 52 bits
            let binaryMantissaPadded = normalizedMantissa.replace('.', '').replace('1', '').replace('-', '').padEnd(52, '0');
    
            //perform checks
            let status = '';
            if (eprime === '11111111111' || normalizedExponent >= 1024) {
                if (binaryMantissaPadded === '0000000000000000000000000000000000000000000000000000') {
                    if (signBit === '0') {
                        status = '+inf';
                        return status;
                    }
                    else {
                        status = '-inf';
                        return status;
                    }
                }
            }
            
            if (eprime === '00000000000' || normalizedExponent <= -1023) { //e' == 0
                if (binaryMantissaPadded === '0000000000000000000000000000000000000000000000000000') {
                    if (signBit === '0') {
                        status = '+0';
                        return status;
                    }
                    else {
                        status = '-0';
                        return status;
                    }
                }
                else { //e' == zero, but significand != 0
                    status = 'Denormalized';
                    return status;
                }
            }
            
            //combine 
            let binary = signBit + eprime + binaryMantissaPadded;
            
            var output = ""
            split = binary.split("")
            for(let i = 0; i < split.length; i++){
                output += split[i]
                if((i + 1) % 4 == 0 && i != 0) output += " "
            }

            let hex = converttoHex(binary);
            return {output: output, hex: hex};
        }
    
        function converttoHex(bits){
            let hex = '';
            for (let i = 0; i < bits.length; i+=4) {
                let nibble = bits.substr(i,4);
                let hexDigit = parseInt(nibble, 2).toString(16);
                
                hex += hexDigit;
                if((i + 1) % 4 == 0) hex += " "
            }

            return '0x' + hex;
        }
        
        function mantissaInputCheck(base, mantissa){
            for(char of mantissa.split("")){
                if(base == 2){
                    if(char != '0' && char != '1' && char != '.' && char != '-' ){
                        return "Please enter a valid binary input"
                    }
                }
                else if(base == 10){
                    if(char != '0' && char != '1' && char != '.' && char != '-' && char != '2'  
                       && char != '3' && char != '4' && char != '5'  && char != '6'  && char != '7'
                       && char != '8'  && char != '9'){
                        return "Please enter a valid decimal input"
                    }
                }
                else{
                    return "Please enter 2 or 10 for the base"
                }
            }
        }

        function exponentInputCheck(exponent){
            for(char of exponent.split("")){
                if(char != '0' && char != '1' && char != '-' && char != '2'  
                       && char != '3' && char != '4' && char != '5'  && char != '6'  && char != '7'
                       && char != '8'  && char != '9'){
                    return "Please enter a valid decimal exponent"
                }
            }
        }

        
        // function returnOutput() {
        //     subprocess = '';
        //     output = '';
            
        //     subprocess = normalize(input_mantissa, input_exponent);
        //     output = binarytofloat64(subprocess[0], subprocess[1]);
        //     document.getElementById('output-binary-text').innerHTML = output;
        // }

        // function roundToNearest(mantissa){
        //     let bits = mantissa.split('');
        //     let lastBit = bits[bits.length-1];
    
        //     bits = bits.slice(0, bits.length - 1);
        //     let roundUp = false;
        //     for (let i = bits.length - 1; i >= 0; i--) {
        //         if (bits[i] === '1') {
        //             if (!roundUp) {
        //                 roundUp = true;
        //             }
        //         }
        //         else if (roundUp) {
        //             bits[i] = '1';
        //             roundUp = false;
        //         }
        //         if (i === bits.length - 53) {
        //             break;
        //         }
        //     }
        //     if (roundUp) {
        //         lastBit = '1';
        //     }
        //     bits.push(lastBit);
        //     return bits.join('');
        // }
    });
})



