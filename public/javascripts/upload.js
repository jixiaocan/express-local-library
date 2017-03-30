var shadow = document.querySelector(".shadow");
var uploadInput = document.querySelector("#upload-input");
var img = document.querySelector("#userPic");

uploadInput.onmouseover = function(){
    shadow.style.display="block";
};
uploadInput.onmouseout = function(){
    shadow.style.display="none";
};

shadow.onclick = function(){
    uploadInput.click();
};

uploadInput.addEventListener('change',handleFiles,false);
function handleFiles() {
	var file = this.files[0]; 

    var imageType = /^image\//;
        if(!imageType.test(file.type)){
            return;
        }
        // show img 
        showImg(file);

        // upload img
        // sendFile(file);
}

function showImg(file){
	// img.classList.add('obj');
	img.file = file;

	var reader = new FileReader();
	reader.onload = (function(aImg){
		return function(e){
			aImg.src = e.target.result;
		};
	})(img);
	reader.readAsDataURL(file);
}

function sendFile(file) {
    var xhr = new XMLHttpRequest();
    var fd = new FormData();

    xhr.upload.addEventListener('progress',function(event){
    	if (event.lengthComputable) {
    		// calculate the percentage of upload completed
            var percentComplete = event.loaded / event.total;
            percentComplete = parseInt(percentComplete * 100);

            // update the Bootstrap progress bar with the new percentage
            var progressbar = document.querySelector(".progress-bar");
            progressbar.innerHTML = percentComplete + '%';
            progressbar.style.width = percentComplete + '%';

            // once the upload reaches 100%, set the progress bar text to done
            if (percentComplete === 100) {
            	progressbar.innerHTML = 'Done';
            }
    	}
    },false);
    
    xhr.open("POST", "/upload", true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            console.log(xhr.responseText); // handle response.
        }
    };
    fd.append('myFile', file);
    xhr.send(fd);
}