export const resetPassword = `<div class="wrap-login100 p-l-55 p-r-55 p-t-65 p-b-54">
<form class="login100-form validate-form" method="post">
    <span class="login100-form-title p-b-49">
        Change password
    </span>
    <div class="wrap-input100 validate-input m-b-23">
        <span class="label-input100">New password - at some point we'll add a second confirmation one AND we need to tell the user it
        has to have whatever rules we specify... OR we just echo back error messages from auth2 in HTML</span>
        <input class="input100" type="text" name="password" placeholder="Type your password" value="{{password}}"
            required />
        <span class="focus-input100" data-symbol=""></span>
    </div>
    <div>
        {{errorMessage}}
    </div>
    <div class="container-login100-form-btn">
        <div class="wrap-login100-form-btn">
            <div class="login100-form-bgbtn"></div>
            <button class="login100-form-btn">
                Change password
            </button>
        </div>
    </div>
</form>
</div>`;
