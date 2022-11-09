function toast(msg){
    const id = Math.round(Math.random()*100);
    $('.toast-container').html(`
        <div id="${id}" class="toast align-items-center" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body text-wrap">
                    ${msg}
                </div>
            </div>
        </div>`)

    const Toast = new bootstrap.Toast(document.getElementById(id),{'delay': 3000});
    Toast.show();
}