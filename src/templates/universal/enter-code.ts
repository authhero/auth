export const enterCode = `<div class="wrap-login100 p-l-55 p-r-55 p-t-65 p-b-54">
<form class="login100-form validate-form" method="post">
    <span class="login100-form-title p-b-49">
        Enter code
    </span>
    <div class="wrap-input100 validate-input m-b-23">
        <span class="label-input100">Code</span>
        <input class="input100" type="text" name="code" placeholder="Enter the code from the email" required />
        <span class="focus-input100" data-symbol=""></span>
    </div>
    <div>
        {{errorMessage}}
    </div>
    <div class="container-login100-form-btn">
        <div class="wrap-login100-form-btn">
            <div class="login100-form-bgbtn"></div>
            <button class="login100-form-btn">
                Login
            </button>
        </div>
    </div>
</form>
</div>`;
