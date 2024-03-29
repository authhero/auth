export const login = `<div class="wrap-login100 p-l-55 p-r-55 p-t-65 p-b-54">
<form class="login100-form validate-form" method="post">
    <span class="login100-form-title p-b-49">
        Login
    </span>
    <div class="wrap-input100 validate-input m-b-23">
        <span class="label-input100">Username</span>
        <input class="input100" type="text" name="username" placeholder="Type your username" value="{{username}}"
            required />
        <span class="focus-input100" data-symbol=""></span>
    </div>
    <div class="wrap-input100 validate-input" data-validate="Password is required">
        <span class="label-input100">Password</span>
        <input class="input100" type="password" name="password" placeholder="Type your password" required />
        <span class="focus-input100" data-symbol=""></span>
    </div>
    <div class="text-right p-t-8 p-b-31">
        <a href="/u/forgot-password?state={{state}}">
            Forgot password?
        </a>
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
    <div class="txt1 text-center p-t-20 p-b-20">
        <span>
            Or Sign Up Using
        </span>
    </div>
    <div class="flex-c-m">
        {% for item in connections %}
        <a href="{{ item.href }}" class="login100-social-item {{ item.bg_class }}">
            <i class="fa fa-{{ item.icon_class }}"></i>
        </a>
        {% endfor %}
    </div>
    <div class="text-center flex-col-m p-t-20">
        <span class="txt1 p-b-17">
            Or Login With
        </span>
        <a href="/u/code?state={{state}}" class="txt2">
            Code
        </a>
    </div>
    <div class="text-center flex-col-m p-t-20">
        <span class="txt1 p-b-17">
            Or Sign Up Using
        </span>
        <a href="/u/signup?state={{state}}" class="txt2">
            Email
        </a>
    </div>
</form>
</div>`;
