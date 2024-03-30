import * as React from 'react'
import {
  Image,
  LayoutAnimation,
  LayoutChangeEvent,
  Linking,
  StyleProp,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  TouchableWithoutFeedbackProps,
  View,
  ViewStyle,
} from 'react-native'

import { PreviewData, PreviewDataImage } from './types'
import { getPreviewData, oneOf } from './utils'
import styled from 'styled-components/native'
import { Fonts } from '@base/ui-kit'

export interface LinkPreviewProps {
  containerStyle?: StyleProp<ViewStyle>
  enableAnimation?: boolean
  metadataContainerStyle?: StyleProp<ViewStyle>
  metadataTextContainerStyle?: StyleProp<ViewStyle>
  onPreviewDataFetched?: (previewData: PreviewData) => void
  previewData?: PreviewData
  renderDescription?: (description: string) => React.ReactNode
  renderImage?: (image: PreviewDataImage) => React.ReactNode
  renderLinkPreview?: (payload: {
    aspectRatio?: number
    containerWidth: number
    previewData?: PreviewData
  }) => React.ReactNode
  renderTitle?: (title: string) => React.ReactNode
  requestTimeout?: number
  text: string
  touchableWithoutFeedbackProps?: TouchableWithoutFeedbackProps
}

const containerWidth = 60;

export const LinkPreview = React.memo(
  ({
    containerStyle,
    enableAnimation,
    metadataContainerStyle,
    metadataTextContainerStyle,
    onPreviewDataFetched,
    previewData,
    renderDescription,
    renderImage,
    renderLinkPreview,
    renderTitle,
    requestTimeout = 5000,
    text,
    touchableWithoutFeedbackProps,
  }: LinkPreviewProps) => {
    const [data, setData] = React.useState(previewData)
    const aspectRatio = data?.image
      ? data.image.width / data.image.height
      : undefined

    React.useEffect(() => {
      let isCancelled = false
      if (previewData) {
        setData(previewData)
        return
      }

      const fetchData = async () => {
        setData(undefined)
        const newData = await getPreviewData(text, requestTimeout)
        // Set data only if component is still mounted
        /* istanbul ignore next */
        if (!isCancelled) {
          // No need to cover LayoutAnimation
          /* istanbul ignore next */
          if (enableAnimation) {
            LayoutAnimation.easeInEaseOut()
          }
          setData(newData)
          onPreviewDataFetched?.(newData)
        }
      }

      fetchData()
      return () => {
        isCancelled = true
      }
    }, [
      enableAnimation,
      onPreviewDataFetched,
      previewData,
      requestTimeout,
      text,
    ])

    const handlePress = () => data?.link && Linking.openURL(data.link)

    const renderTitleNode = (title: string) => {
      return oneOf(
        renderTitle,
        <STitle numberOfLines={2} >
          {title}
        </STitle>
      )(title)
    }

    const renderDescriptionNode = (description: string) => {
      return oneOf(
        renderDescription,
        <SText numberOfLines={3} >
          {description}
        </SText>
      )(description)
    }

    const renderImageNode = (image: PreviewDataImage) => {
      const ar = aspectRatio ?? 1

      return oneOf(
        renderImage,
        <Image
          accessibilityRole='image'
          resizeMode='contain'
          source={{ uri: image.url }}
          style={StyleSheet.flatten([
            { marginRight: 8, borderRadius: 2 },
            ar < 1
              ? {
                height: containerWidth,
                width: containerWidth * ar,
              }
              : {
                height: containerWidth / ar,
                width: containerWidth,
              }
          ])}
        />
      )(image)
    }

    const renderLinkPreviewNode = () => {
      return oneOf(
        renderLinkPreview,
        <ViewPreviewLink style={containerStyle}>
          <View
              style={StyleSheet.flatten([
                styles.metadataContainer,
                metadataContainerStyle,
              ])}
            >
              {data?.image && renderImageNode(data.image)}
              <View
                style={StyleSheet.flatten([
                  styles.metadataTextContainer,
                  metadataTextContainerStyle,
                ])}
              >
                {data?.title && renderTitleNode(data.title)}
                {data?.description && renderDescriptionNode(data.description)}
              </View>
            </View>
        </ViewPreviewLink>
      )({
        aspectRatio,
        containerWidth,
        previewData: data,
      })
    }

    return ((data?.description || data?.title) ? (
      <TouchableWithoutFeedback
        accessibilityRole='button'
        onPress={handlePress}
        {...touchableWithoutFeedbackProps}
      >
        {renderLinkPreviewNode()}
      </TouchableWithoutFeedback>
    ) : <></>
    )
  }
)

const ViewPreviewLink = styled.View`
  background-color: ${p => p.theme.grey6};
  border-bottom-width: 0.5px;
  border-top-width: 0.5px;
  border-color: ${p => p.theme.grey5};
`

const STitle = styled.Text`
  font-size: 13px;
  font-family: ${Fonts.Bold};
  color: ${p => p.theme.grey1};
`

const SText = styled.Text`
  font-size: 12px;
  color: ${p => p.theme.grey2};
  margin-top: 4px;
`

const styles = StyleSheet.create({
  metadataContainer: {
    flexDirection: 'row',
    padding: 12
  },
  metadataTextContainer: {
    flex: 1,
  },
})
