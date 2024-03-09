export const signup = `<div class="wrap-login100 p-l-55 p-r-55 p-t-65 p-b-54">
<form class="login100-form validate-form" method="post">
    <span class="login100-form-title p-b-49">
        Signup
    </span>
    <div class="wrap-input100 validate-input m-b-23">
        <span class="label-input100">Username</span>
        <input class="input100" type="text" name="username" placeholder="Type your username" value="{{username}}"
            required />
        <span class="focus-input100" data-symbol=""></span>
    </div>
    <div class="wrap-input100 validate-input" data-validate="Password is required">
        <span class="label-input100">Password</span>
        <input class="input100" type="text" name="password" placeholder="Type your password" required />
        <span class="focus-input100" data-symbol=""></span>
    </div>
    <div>
        {{errorMessage}}
    </div>
    <div class="p-t-8 p-b-31">
    </div>
    <div class="container-login100-form-btn">
        <div class="wrap-login100-form-btn">
            <div class="login100-form-bgbtn"></div>
            <button class="login100-form-btn">
                Signup
            </button>
        </div>
    </div>
    <div class="text-center flex-col-m p-t-20">
        <span class="txt1 p-b-17">
            Already have an account?
        </span>
        <a href="/u/login?state={{state}}" class="txt2">
            Login
        </a>
    </div>
</form>
</div>`;
