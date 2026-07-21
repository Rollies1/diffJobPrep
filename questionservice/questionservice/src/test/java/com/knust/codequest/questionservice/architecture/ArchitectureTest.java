package com.knust.codequest.questionservice.architecture;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.lang.ArchRule;
import org.junit.jupiter.api.Test;

import com.tngtech.archunit.core.importer.ImportOption;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

class ArchitectureTest {

    private final JavaClasses importedClasses = new ClassFileImporter()
            .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
            .importPackages("com.knust.codequest.questionservice");

    @Test
    void servicesShouldOnlyBeAccessedByControllersOrOtherServices() {
        ArchRule rule = classes()
                .that().resideInAPackage("..service..")
                .should().onlyBeAccessed().byAnyPackage("..controller..", "..service..");

        rule.check(importedClasses);
    }

    @Test
    void controllersShouldNotAccessRepositoriesDirectly() {
        ArchRule rule = noClasses()
                .that().resideInAPackage("..controller..")
                .should().accessClassesThat().resideInAPackage("..repository..");

        rule.check(importedClasses);
    }

    @Test
    void interfacesShouldNotHaveInterfacePrefix() {
        ArchRule rule = noClasses()
                .that().areInterfaces()
                .should().haveSimpleNameStartingWith("I");

        rule.check(importedClasses);
    }

    @Test
    void controllersShouldBeSuffixedWithController() {
        ArchRule rule = classes()
                .that().resideInAPackage("..controller..")
                .and().areNotNestedClasses()
                .should().haveSimpleNameEndingWith("Controller");

        rule.check(importedClasses);
    }

    @Test
    void repositoriesShouldBeSuffixedWithRepository() {
        ArchRule rule = classes()
                .that().resideInAPackage("..repository..")
                .should().haveSimpleNameEndingWith("Repository");

        rule.check(importedClasses);
    }

    @Test
    void dtosShouldBeSuffixedWithDtoOrRequestOrResponse() {
        ArchRule rule = classes()
                .that().resideInAPackage("..dto..")
                .and().areNotNestedClasses()
                .should().haveSimpleNameEndingWith("Dto")
                .orShould().haveSimpleNameEndingWith("Request")
                .orShould().haveSimpleNameEndingWith("Response");

        rule.check(importedClasses);
    }
}
