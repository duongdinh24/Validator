
// Đối tượng Validator
function Validator(options) {
    var formElement = document.querySelector(options.form);
    var selectorRules = {};   
    function getParent(element, selector) {
        while(element.parentElement) {
            if (element.parentElement.matches(selector)) {
                return element.parentElement;
            }
            element = element.parentElement;
        }
    }
    // Hàm thực hiện validate
    function validate(inputElement, rule) {
        var errorMessage;
        // var errorElement = getParent(inputElement, '.form-group');
        var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector);

        // Lấy ra tất cả các rule của 1 selector
        var rules = selectorRules[rule.selector];

        // Duyệt qua từng rule
        for (var i = 0; i < rules.length; i++) {
            switch (inputElement.type) {
                case 'radio':
                case 'checkbox':
                    errorMessage = rules[i](
                        formElement.querySelector(rule.selector + ':checked')
                    );
                    break;
                default:
                    errorMessage = rules[i](inputElement.value);
            }
            
            if (errorMessage)
                break;
        }

        if (errorMessage) {
            errorElement.innerHTML = errorMessage;
            getParent(inputElement, options.formGroupSelector).classList.add('invalid');
        }
        else {
            errorElement.innerHTML = '';
            getParent(inputElement, options.formGroupSelector).classList.remove('invalid');
        }

        return !errorMessage;
    }

    // Xử lý nếu có thẻ form
    if (formElement) {

        // Khi submit form
        formElement.onsubmit = function(e) {
            e.preventDefault();
            var isFormValid = true;
            options.rules.forEach(function (rule) {
                var inputElement = formElement.querySelector(rule.selector);
                var isValid = validate(inputElement, rule);
                if (!isValid)
                    isValidForm = false;
            });


            if(isFormValid) {
                var enableInputs = formElement.querySelectorAll('[name]:not([disabled])');
                var formValues = Array.from(enableInputs).reduce(function (values, input) {
                    switch (input.type) {
                        case 'checkbox':
                            if(!input.matches(':checked')) { // nếu k đc check thì return, chuyển qua ptu tiếp theo
                                values[input.name] = '';    // Gán bằng chuỗi rỗng
                                return values;
                            } 
                            if(!Array.isArray(values[input.name]))      // Nếu chưa có mảng, tạo mảng lưu value checkbox
                                values[input.name] = [];
                            values[input.name].push(input.value);
                            break;
                        case 'radio':
                            values[input.name] = formElement.querySelector('input[name = "' + input.name +' "]:checked').value;
                            break;
                            // formElement.querySelector('input[name = "example"]:checked');
                        case 'file':
                            values[input.name] = input.files;
                            break;
                        default:
                            values[input.name] = input.value;

                    }
                    return values;
                }, {});

                // console.log('Không có lỗi');
                if (typeof options.onSubmit === 'function' ) {
                    options.onSubmit(formValues);
                }
                else {
                    formElement.submit();
                }
            }
            
        }

        // Lặp qua mỗi rule và xử lý sự kiện
        options.rules.forEach(function (rule) {

            // Lưu rule cho mỗi input, mỗi được lưu đều là một function
            if(Array.isArray(selectorRules[rule.selector])) {
                selectorRules[rule.selector].push(rule.test);
            }
            else {
                selectorRules[rule.selector] = [rule.test];
            }


            var inputElements = formElement.querySelectorAll(rule.selector);
            Array.from(inputElements).forEach(function(inputElement) {
                // Xử lý khi blur khỏi input
                inputElement.onblur = function () {
                    validate(inputElement, rule);
                }

                // Xử lý khi đang nhập vào input
                inputElement.oninput = function () {
                    var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector);
                    errorElement.innerHTML = '';
                    getParent(inputElement, options.formGroupSelector).classList.remove('invalid');
                }
            });
           
        });
    }
}


// Định nghĩa rule
Validator.isRequired = function(selector, message) {
    return {
        selector: selector,
        test: function(value) {
            return value.trim() ? undefined : message || 'Vui lòng nhập trường này';

        }
    };

}

Validator.isEmail = function(selector, message) {
    return {
        selector: selector,
        test: function(value) {
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regex.test(value) ? undefined : message || 'Trường này phải là email';
        }
    };
}

Validator.minLength = function(selector, min, message) {
    return {
        selector: selector,
        test: function(value) {
            return value.length >= min ? undefined : message || `Vui lòng nhập tối thiểu ${min} kí tự`;
        }
    };
}

Validator.isConfirmed = function(selector, getConfirmValue, message) {
    return {
        selector: selector,
        test: function(value) {
            return value === getConfirmValue() ? undefined : message || 'Giá trị nhập vào không chính xác';
        }
    }
}