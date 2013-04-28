$(function () {
    $(".show-code").click(function () {
        var block = $(this).parent().find(".code");
        block.toggle();
        if (block.is(":visible")) {
            $(this).html("Hide code");
        } else {
            $(this).html("Show code");
        }
    });
    $("#toggle-other-modules").click(function(){
        var block = $("#other-module");
        block.toggle();
        $(this).find("i").removeClass();
        if (block.is(":visible")) {
            $(this).find("i").addClass("icon-folder-open");
        } else {
            $(this).find("i").addClass("icon-folder-close");
        }
    });
    $("input.toggle-public").click(function(){
        var section = $(this).parents("section:eq(0)");
        if($(this).is(":checked")){
            section.addClass("show-private");
        }else{
            section.removeClass("show-private");
        }
    });

    $(".toggle-package").click(function() {
        var package = $(this).data().package,
            $modules = $("#" + package);
        
        $modules.toggle();
        $(this).find("i").removeClass();
        if ($modules.is(":visible")) {
            $(this).find("i").addClass("icon-folder-open");
        } else {
            $(this).find("i").addClass("icon-folder-close");
        }
    });
    
    // Typeahead initialization
    $("input.typeahead").typeahead([
        {
            name: "modules",
            local: [{"name":"Documenter","value":"Documenter","tokens":["Documenter","Documenter"]},{"name":"GoogleClosureProcessor","value":"language/js/GoogleClosureProcessor","tokens":["Google","Closure","Processor","GoogleClosureProcessor"]},{"name":"IndexGenerator","value":"language/js/IndexGenerator","tokens":["Index","Generator","IndexGenerator"]},{"name":"ModuleGenerator","value":"language/js/ModuleGenerator","tokens":["Module","Generator","ModuleGenerator"]},{"name":"ModuleParser","value":"language/js/ModuleParser","tokens":["Module","Parser","ModuleParser"]},{"name":"RequireProcessor","value":"language/js/RequireProcessor","tokens":["Require","Processor","RequireProcessor"]},{"name":"SearchGenerator","value":"language/js/SearchGenerator","tokens":["Search","Generator","SearchGenerator"]},{"name":"Workspace","value":"utils/Workspace","tokens":["Workspace","Workspace"]}]
        }
    ]).on("typeahead:selected", function(evt){
        window.location.href = window.moduleLevel + "/modules/" + evt.currentTarget.value + ".html";
    });
});