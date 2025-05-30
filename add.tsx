import React, { useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Formik, FormikHelpers } from "formik";
import { View } from "react-native";
import { ImageInfo } from "expo-image-picker";
import { AnimatePresence, MotiView } from "moti";
import { useTheme } from "styled-components/native";

import { RootStackParamList } from "interfaces";
import Back from "components/Back";
import BasicTextInput from "components/BasicTextInput";
import BasicImageInput from "components/BasicImageInput";
import BasicButton from "components/BasicButton";
import Loader from "components/Loader";
import { createAddPlantSchema } from "schemas/AddPlant.schema";
import {
    KeyboardScreen,
    ColumnCenterWrapper,
    InputsWrapper,
} from "styles/shared";
import { ApiErrors } from "enums/api-errors";
import { base64EncodeImage } from "utils/images";
import i18n from "config/i18n";
import BasicCheckbox from "components/BasicCheckbox";
import WateringReminderInput from "components/WateringReminderInput";
import { addPlant } from "services/plant";
import { showToast } from "utils/toast";

type Props = NativeStackScreenProps<RootStackParamList, "addPlant">;

interface AddPlantForm {
    name: string;
    description?: string;
    image?: string;
    wateringReminderFrequency?: number;
}

const { t } = i18n;

const AddPlant = ({ navigation }: Props): JSX.Element => {
    const [loading, setLoading] = useState(false);
    const [isRemindersChecked, setRemindersChecked] = useState(false);
    const [image, setImage] = useState<ImageInfo>();
    const theme = useTheme();

    const onSubmit = async (
        values: AddPlantForm,
        formikHelpers: FormikHelpers<AddPlantForm>
    ) => {
        try {
            setLoading(true);
            const base64EncodedImage = image ? base64EncodeImage(image) : null;

            // Workaround for ReactNative TextField working only on strings
            const wateringReminderFrequency =
                typeof values.wateringReminderFrequency === "string"
                    ? parseInt(values.wateringReminderFrequency)
                    : values.wateringReminderFrequency;

            await addPlant({
                name: values.name.trim(),
                description: values.description?.trim(),
                image: base64EncodedImage,
                ...(isRemindersChecked && {
                    wateringReminderFrequency,
                }),
            });
            formikHelpers.resetForm();
            navigation.navigate("home");
            showToast({
                text1: t("pages.plants.add.success"),
                type: "success",
            })
        } catch (error) {
            switch (error) {
                case ApiErrors.INVALID_FILE:
                    return showToast({
                        text1: t("errors.invalidFileType"),
                        type: "error",
                    })
                default:
                    showToast({
                        text1: t("errors.general"),
                        text2: t("errors.generalDescription"),
                        type: "error",
                      });
            }
        } finally {
            setLoading(false);
        }
    };
    return (
        <KeyboardScreen
            contentContainerStyle={{ paddingBottom: 50 }}
            resetScrollToCoords={{ x: 0, y: 0 }}
            scrollEnabled={true}
            bounces={false}
            style={{
                backgroundColor: theme.background,
            }}
        >
            <ColumnCenterWrapper>
                <Back navigation={navigation} />
                <Formik
                    initialValues={{
                        name: "",
                        description: "",
                        wateringReminderFrequency: 1,
                    }}
                    validationSchema={() =>
                        createAddPlantSchema(isRemindersChecked)
                    }
                    onSubmit={onSubmit}
                    validateOnBlur={false}
                    validateOnChange={false}
                >
                    {({
                        handleChange,
                        handleBlur,
                        handleSubmit,
                        values,
                        errors,
                    }) =>
                        loading ? (
                            <Loader topMargin />
                        ) : (
                            <InputsWrapper>
                                <BasicImageInput
                                    buttonText={t(
                                        "pages.plants.add.uploadPicture"
                                    )}
                                    image={image}
                                    setImage={setImage}
                                />
                                <BasicTextInput
                                    value={values.name}
                                    label={t("common.name")}
                                    placeholder={t(
                                        "pages.plants.add.plantNamePlaceholder"
                                    )}
                                    onChangeText={handleChange("name")}
                                    onBlur={handleBlur("name")}
                                    error={errors.name}
                                />
                                <BasicTextInput
                                    value={values.description}
                                    label={t("common.description")}
                                    placeholder={t(
                                        "pages.plants.add.plantDescriptionPlaceholder"
                                    )}
                                    onChangeText={handleChange("description")}
                                    onBlur={handleBlur("description")}
                                    textarea={true}
                                    error={errors.description}
                                />
                                <BasicCheckbox
                                    label={t(
                                        "pages.plants.add.remindWateringLabel"
                                    )}
                                    isChecked={isRemindersChecked}
                                    setChecked={setRemindersChecked}
                                />
                                <AnimatePresence>
                                    {isRemindersChecked ? (
                                        <MotiView
                                            style={{
                                                paddingTop: 20,
                                                width: "100%",
                                            }}
                                            from={{
                                                opacity: 0,
                                            }}
                                            animate={{
                                                opacity: 1,
                                            }}
                                            exit={{
                                                opacity: 0,
                                            }}
                                        >
                                            <WateringReminderInput
                                                numberValue={
                                                    values.wateringReminderFrequency
                                                }
                                                setNumberValue={handleChange(
                                                    "wateringReminderFrequency"
                                                )}
                                                error={
                                                    errors.wateringReminderFrequency
                                                }
                                            />
                                        </MotiView>
                                    ) : null}
                                </AnimatePresence>
                                <View style={{ marginTop: 30 }}>
                                    <BasicButton
                                        onPress={handleSubmit}
                                        text={t("pages.plants.add.submit")}
                                    />
                                </View>
                            </InputsWrapper>
                        )
                    }
                </Formik>
            </ColumnCenterWrapper>
        </KeyboardScreen>
    );
};

export default AddPlant;
