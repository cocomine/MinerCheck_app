$('.scrollbar-inner').scrollbar();

let timeout_id = 0;
let SHA1;

//彈窗
const editModal = new bootstrap.Modal(document.getElementById('editModal'))
const addModal = new bootstrap.Modal(document.getElementById('addModal'))
const delModal = new bootstrap.Modal(document.getElementById('delModal'))

document.addEventListener('deviceready', function(){
    cordova.getSignatureFingerprint.getSignature(function(sha1){
        SHA1 = sha1
        check().fail(function(){
            loginModal.show();
            toast("密碼錯誤");
        });
    });

    $('#reload').click(function(){
        check().fail(function(){
            loginModal.show();
            toast("密碼錯誤");
        });
    });
    $('#add-url').click(add);
    window.pushNotification.registration((token) => {
        console.debug(token);
    });

    //顯示狀態
    $(document).on('click', '.detail-link', function(){
        $(this).parents('.card-body').find('.detail').slideToggle("slow");
        if($(this).data('stat') === 'close'){
            $(this).data('stat', 'open')
            $(this).find('i').removeClass('fa-angle-down')
            $(this).find('i').addClass('fa-angle-up')
        }else{
            $(this).data('stat', 'close')
            $(this).find('i').addClass('fa-angle-down')
            $(this).find('i').removeClass('fa-angle-up')
        }
    })

    setInterval(detail, 2000); //取得詳細
});

/* 刪除/修改 */
$(document).on('touchstart', '.card', function(){
    const card = this
    timeout_id = setTimeout(function(){
        Delete(card);//刪除
    }, 1000);
}).on('touchend touchmove', function(){
    clearTimeout(timeout_id);
}).on('dblclick', '.card', function(){
    edit(this);//修改
});

//修改ip 彈窗
function edit(card){
    const url = $(card).data('ip');
    const minerType = $(card).data('miner');
    editForm.find('#editForm-url').attr('placeholder', url + " (留空不更改)").val('');
    editForm.find('#editForm-miner').val(minerType);
    editForm.removeClass('was-validated').find('[type="submit"]').data('url', url);
    editModal.show();
}

//修改ip
const editForm = $('#editForm').submit(function(e){
    const formData = new FormData(this);
    if(!e.isDefaultPrevented() && this.checkValidity()){
        e.preventDefault();
        editModal.hide();
        /* 加密 */
        let AEScryptd = new AEScrypt(api_key);
        let data = AEScryptd.encrypt(JSON.stringify({
            'url': $(this).find('[type="submit"]').data('url'),
            'data': {
                'url': formData.get('editForm-url'),
                'miner': formData.get('editForm-miner'),
                'pass': formData.get('editForm-pass')
            }
        }));

        $.ajax({
            type: 'POST',
            url: api_url + '/edit.php',
            contentType: "text/plain; charset=utf-8",
            headers: {
                'X-Android-Cert': SHA1
            },
            data: data,
            success: function(){
                toast("修改成功");
                check();
            },
            error: function(xhr, textStatus){
                if(textStatus === "timeout") toast("請求超時");
                if(textStatus === "error"){
                    if(xhr.status === 500) toast("伺服器錯誤");
                    else if(xhr.status === 403) toast("未能確認客戶端");
                    else if(xhr.status === 405) toast("請求方式出錯");
                    else if(xhr.status === 400) toast("修改失敗");
                    else toast("發生錯誤");
                }
            }
        });
    }
});

//跳出密碼輸入
editForm.find('#editForm-miner').change(function(){
    if(this.value === '1'){ //t-rex
        editForm.find('#editForm-pass-col').show();
    }else{
        editForm.find('#editForm-pass-col').hide();
    }
})

//詳細狀態
function detail(){
    $.ajax({
        type: 'GET',
        url: api_url + (showMore ? '/more.php' : '/detail.php'),//顯示更多資訊, 顯示簡約資訊
        headers: {
            'X-Android-Cert': SHA1
        },
        success: function(data){
            /* 確認資料 解密 */
            let AEScryptd = new AEScrypt(api_key);
            data = AEScryptd.decrypt(data);
            if(!data){
                $('.detail').html("<span style='color: var(--text-gary)'>無法確認資料, 請檢查api_key</span>");
                return;
            }

            $.each(data, function(key, val){
                let gpus = '';
                $.each(val.gpus, function(key, gpu){
                    if(showMore){
                        gpus += `<div class="col-12">
                                <div class="row g-0">
                                    <div class="col-4" style="font-size: 1.2em">${gpu.accepted_count}<small>有效</small></div>
                                    <div class="col-4 ${gpu.invalid_count > 10 ? 'text-warning' : ''}" style="font-size: 1.2em">${gpu.invalid_count}<small>無效</small></div>
                                    <div class="col-4 ${gpu.rejected_count > 5 ? 'text-warning' : ''}" style="font-size: 1.2em">${gpu.rejected_count}<small>拒絕</small></div>
                                    <div class="w-100"></div>
                                    <div class="col-4 ${gpu.temp <= 60 ? 'text-success' : (gpu.temp < 90 ? 'text-warning' : 'text-danger')}"><small>Core </small>${gpu.temp}<small><sup>°C</sup></small></div>
                                    <div class="col-4 ${gpu.mtemp <= 60 ? 'text-success' : (gpu.mtemp < 90 ? 'text-warning' : 'text-danger')}"><small>Memory </small>${gpu.mtemp}<small><sup>°C</sup></small></div>
                                    <div class="col-4"><small>Fan </small>${gpu.fan}<small>%</small></div>
                                    <div class="w-100"></div>
                                    <div class="col-4" style="font-size: 1.5em">${gpu.hashrate} <small>MH/s</small></div>
                                    <div class="col-4" style="font-size: 1.5em">${gpu.efficiency} <small>kH/w</small></div>
                                    <div class="w-100"></div>
                                    <div class="col-4" style="font-size: 1.1em"><small>Core </small>${gpu.cclock}<small><sub>MHz</sub></small></div>
                                    <div class="col-4" style="font-size: 1.1em"><small>Memory </small>${gpu.mclock}<small><sub>MHz</sub></small></div>
                                    <div class="col-4" style="font-size: 1.1em">${gpu.power}<small>w</small></div>
                                    <div class="w-100">
                                    <div class="card-text col-12">${gpu.info} <small>GPU ${gpu.gpu_id}</small></div>
                            </div>
                            </div><br>`;
                    }else{
                        gpus += `<div class="col-4">
                                <span style="font-size: 1.2em"><small>無效</small> ${gpu.invalid_count}</span> ${gpu.power}<small>w</small><br>
                                <span style="font-size: 1.5em">${gpu.hashrate} <small>MH/s</small></span><br>
                                <span class="card-text">GPU ${gpu.gpu_id}</span>
                            </div>`;
                    }
                });

                $(`[data-ip="${val.url}"]`).find('.detail').html(`
                <hr>
                <div class="row">
                    ${gpus}
                </div>
                <br>
                <div class="row">
                    <div class="col">
                        <span style="font-size: 2em; font-weight: bold">${val.hashrate} <small>MH/s</small></span><br>
                        <span class="card-text">總算力</span>
                    </div>
                    <div class="col">
                        <span style="font-size: 2em; font-weight: bold">${val.hashrate_day} <small>MH/s</small></span><br>
                        <span class="card-text">平均算力 <small>24小時</small></span>
                    </div>
                </div>`);
            });

        },
        error: function(xhr, textStatus){
            if(textStatus === "timeout"){
                $('.detail').html(`
            <div class="row align-content-center justify-content-center">
                <div class="col-auto">
                    <a href="#" class="detail-link" data-stat="close"><i class="fa fa-unlink"></i></a>
                </div>
            </div>`);
            }
            if(textStatus === "error"){
                if(xhr.status === 500) $('.detail').html("<span style='color: var(--text-gary)'>伺服器錯誤</span>");
                else if(xhr.status === 403) $('.detail').html("<span style='color: var(--text-gary)'>未能確認客戶端</span>");
                else if(xhr.status === 405) $('.detail').html("<span style='color: var(--text-gary)'>請求方式出錯</span>");
                else $('.detail').html("<span style='color: var(--text-gary)'>發生錯誤</span>");
            }
        }
    })
}

//決定是否顯示更多
let showMore = false;
$('#showMore').change(function(){
    showMore = this.checked;
})

//查詢狀態
const check = function(){
    let deferred = new $.Deferred();
    $('#reload').addClass('fa-spin');
    $.ajax({
        type: 'GET',
        url: api_url,
        headers: {
            'x-android-cert': SHA1
        },
        success: function(data){
            /* 確認資料 解密 */
            let AEScryptd = new AEScrypt(api_key);
            data = AEScryptd.decrypt(data);
            if(!data){
                window.plugins.toast.showLongBottom("無法確認資料, 請檢查api_key是否一致");
                deferred.reject("無法確認資料, 請檢查api_key是否一致");
                return;
            }
            deferred.resolve(data);

            $('#Content').html('')
            $.each(data, function(key, val){
                let detail = ''
                if(val.minerType >= 1){
                    detail = `
                        <div class="detail" style="display: none">
                            <p class="text-center" style="font-size: 1.5em"><i class="fa fa-circle-o-notch fa-spin"></i></p>
                        </div>
                        <div class="row align-content-center justify-content-center">
                            <div class="col-auto">
                                <a href="#" class="detail-link" data-stat="close"><i class="fa fa-angle-down"></i></a>
                            </div>
                        </div>`
                }
                $('#Content').append(`
                <div class="col-md-6">
                    <div class="card shadow" data-ip="${val.url}" data-miner="${val.minerType}">
                        <div class="card-body">
                            <h5 class="card-title"><i class="fa fa-circle online-icon ${val.online ? 'online' : 'offline'}"></i>&nbsp;&nbsp;&nbsp;${val.online ? '在線' : '不在線'}</h5>
                            <span class="card-text">${val.url}</span>
                            <hr>
                            <div class="row">
                                <div class="col"><span class="card-text">最後在線時間</span><br>${val.last_online}</div>
                                <div class="col"><span class="card-text">最後檢查時間</span><br>${val.last_check}</div>
                            </div>
                            ${detail}
                        </div>
                    </div>
                </div>`);
            });
            toast("更新成功");
        },
        error: function(xhr, textStatus){
            if(textStatus === "timeout") toast("請求超時");
            if(textStatus === "error"){
                if(xhr.status === 500) toast("伺服器錯誤");
                else if(xhr.status === 403) toast("未能確認客戶端");
                else if(xhr.status === 405) toast("請求方式出錯");
                else toast("發生錯誤");
            }
        }
    }).always(function(){
        $('#reload').removeClass('fa-spin');
    });
    return deferred;
}

//添加IP
const addForm = $('#addForm').submit(function(e){
    const formData = new FormData(this);
    if(!e.isDefaultPrevented() && this.checkValidity()){
        e.preventDefault();
        addModal.hide();
        /* 加密 */
        let AEScryptd = new AEScrypt(api_key);
        let data = AEScryptd.encrypt(JSON.stringify({
            'data': {
                'url': formData.get('addForm-url')
            }
        }));

        $.ajax({
            type: 'POST',
            url: api_url + '/add.php',
            contentType: "text/plain; charset=utf-8",
            headers: {
                'X-Android-Cert': SHA1
            },
            data: data,
            success: function(){
                toast("添加成功");
                check();
            },
            error: function(xhr, textStatus){
                if(textStatus === "timeout") toast("請求超時");
                if(textStatus === "error"){
                    if(xhr.status === 500) toast("伺服器錯誤");
                    else if(xhr.status === 403) toast("未能確認客戶端");
                    else if(xhr.status === 405) toast("請求方式出錯");
                    else if(xhr.status === 400) toast("添加失敗");
                    else toast("發生錯誤");
                }
            }
        });
    }
})

//添加IP 彈窗
function add(){
    addForm.find('#addForm-url').val('');
    addForm.removeClass('was-validated');
    addModal.show();
}

//刪除ip
const delForm = $('#delForm').submit(function(e){
    if(!e.isDefaultPrevented() && this.checkValidity()){
        e.preventDefault();
        delModal.hide();
        /* 加密 */
        let AEScryptd = new AEScrypt(api_key);
        let data = AEScryptd.encrypt(JSON.stringify({
            'data': {
                'url': $(this).find('#delForm-url').text()
            }
        }));

        $.ajax({
            type: 'POST',
            url: api_url + '/delete.php',
            contentType: "text/plain; charset=utf-8",
            data: data,
            headers: {
                'X-Android-Cert': SHA1
            },
            success: function(){
                toast("刪除成功");
                check();
            },
            error: function(xhr, textStatus){
                if(textStatus === "timeout") toast("請求超時");
                if(textStatus === "error"){
                    if(xhr.status === 500) toast("伺服器錯誤");
                    else if(xhr.status === 403) toast("未能確認客戶端");
                    else if(xhr.status === 405) toast("請求方式出錯");
                    else if(xhr.status === 400) toast("刪除失敗");
                    else toast("發生錯誤");
                }
            }
        });
    }
})

//刪除ip 彈窗
function Delete(card){
    const url = $(card).data('ip');
    delForm.find('#delForm-url').text(url);
    delModal.show();
}

//validation
(function(){
    'use strict'

    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    var forms = document.querySelectorAll('.needs-validation')

    // Loop over them and prevent submission
    Array.prototype.slice.call(forms).forEach(function(form){
        form.addEventListener('submit', function(event){
            if(!form.checkValidity()){
                event.preventDefault()
                event.stopPropagation()
            }

            form.classList.add('was-validated')
        }, false)
    })
})()