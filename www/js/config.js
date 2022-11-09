const loginModal = new bootstrap.Modal(document.getElementById('loginModal'), {backdrop: 'static'})
const api_url = 'hostname';
let api_key = localStorage.getItem('api_key');
if(!api_key){
    loginModal.show();
}
$('#loginForm').submit(function(e){
    const formData = new FormData(this);
    if(!e.isDefaultPrevented() && this.checkValidity()){
        e.preventDefault();

        let md = forge.md.sha256.create();
        md.update(formData.get('loginForm-pass'));
        api_key = md.digest().toHex();

        check().fail(function(){
            $('#loginForm-pass').val('');
            toast("密碼錯誤");
        }).done(function(){
            loginModal.hide();
            localStorage.setItem('api_key', api_key);
        });
    }
});
$('#gen-pass').click(function(e){
    e.preventDefault();

    let md = forge.md.sha256.create();
    md.update($('#loginForm-pass').val());
    $('#code').text(md.digest().toHex());
    $('#api-key').show();
})