import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
        allowDefaultProject: ["*.js", "*.ts"],
      },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error", {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_"
        }
      ],
      //"@typescript-eslint/strict-boolean-expressions": ["error", {
        //allowString: false,
        //allowNumber: false,
        //allowNullableObject: true,
        //allowNullableBoolean: false,
        //allowNullableString: false,
        //allowNullableNumber: false,
        //allowAny: false,
      //}],
    },
  },
  {
    ignores: ["dist/", "node_modules/", "src/oldcode/"],
  }
]);
