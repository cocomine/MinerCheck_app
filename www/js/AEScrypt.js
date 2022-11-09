class AEScrypt {
    constructor(key){
        this.key = key.substr(0, 4)+key.substr(16, 4)+key.substr(32, 4)+key.substr(-4);
    }

    decrypt(data){
        try{
            let key = this.key
            data = forge.util.decode64(data);
            const iv = data.slice(0, 12);
            const tag = data.slice(-16);
            const ciphertext = data.slice(12, -16);
            //console.log(data)
            //console.log(iv, "\n", ciphertext, "\n", tag)

            let decipher = forge.cipher.createDecipher('AES-GCM', key);
            decipher.start({
                iv: iv,
                tagLength: 128,
                tag: tag // authentication tag from encryption
            });
            decipher.update(forge.util.createBuffer(ciphertext));
            let pass = decipher.finish();

            //console.log(decipher.output.data)
            if(pass){
                return JSON.parse(decipher.output.data);
            }else{
                return false;
            }
        }catch(e){
            return false;
        }
    }

    encrypt(data){
        try{
            let key = this.key
            let iv = forge.random.getBytesSync(12);
            let cipher = forge.cipher.createCipher('AES-GCM', key);
            cipher.start({
                iv: iv // should be a 12-byte binary-encoded string or byte buffer
            });
            cipher.update(forge.util.createBuffer(data));
            cipher.finish();
            let encrypted = cipher.output;
            let tag = cipher.mode.tag;

            //console.log(iv, "\n", encrypted.data, "\n",tag.data);
            //console.log(iv + encrypted.data + tag.data);
            return forge.util.encode64(iv + encrypted.data + tag.data);
        }catch(e){
            return false;
        }
    }
}